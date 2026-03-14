import type { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getAuthenticatedContext } from "@/lib/supabase/context"

export const metadata: Metadata = {
  title: "Quality | SysPilot",
  description: "Run inspections, capture NCRs, and track corrective actions.",
}

const inspectionStatuses = ["pending", "passed", "failed", "on_hold"] as const
const inspectionTypes = ["incoming", "in_process", "final", "customer_return"] as const

const createInspectionSchema = z.object({
  product_id: z.string().uuid(),
  work_order_id: z.string().uuid().optional(),
  inspection_type: z.enum(inspectionTypes),
  quantity_inspected: z.coerce.number().int().nonnegative(),
})

const updateInspectionSchema = z.object({
  inspection_id: z.string().uuid(),
  status: z.enum(inspectionStatuses),
  quantity_passed: z.coerce.number().int().nonnegative(),
  quantity_failed: z.coerce.number().int().nonnegative(),
  defect_description: z.string().optional(),
  corrective_action: z.string().optional(),
})

export default async function QualityPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [productsResult, workOrdersResult, inspectionsResult] = await Promise.all([
    supabase.from("products").select("id,name,sku").eq("company_id", companyId).order("name"),
    supabase.from("work_orders").select("id,wo_number").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase
      .from("quality_inspections")
      .select("id,inspection_number,product_id,work_order_id,inspection_type,status,quantity_inspected,quantity_passed,quantity_failed,defect_description,corrective_action,created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ])

  if (productsResult.error || workOrdersResult.error || inspectionsResult.error) {
    throw new Error("Unable to load quality module")
  }

  const products = productsResult.data ?? []
  const workOrders = workOrdersResult.data ?? []
  const inspections = inspectionsResult.data ?? []

  const productMap = new Map(products.map((product) => [product.id, product]))
  const workOrderMap = new Map(workOrders.map((order) => [order.id, order]))

  async function createInspection(formData: FormData) {
    "use server"

    const rawWorkOrderId = String(formData.get("work_order_id") ?? "").trim()

    const parsed = createInspectionSchema.parse({
      product_id: formData.get("product_id"),
      work_order_id: rawWorkOrderId || undefined,
      inspection_type: formData.get("inspection_type"),
      quantity_inspected: formData.get("quantity_inspected"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } = await getAuthenticatedContext()

    const { error } = await serverSupabase.from("quality_inspections").insert({
      company_id: serverCompanyId,
      inspection_number: `QC-${Date.now()}`,
      product_id: parsed.product_id,
      work_order_id: parsed.work_order_id ?? null,
      inspection_type: parsed.inspection_type,
      status: "pending",
      quantity_inspected: parsed.quantity_inspected,
      quantity_passed: 0,
      quantity_failed: 0,
      inspector_id: serverUser.id,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/quality")
  }

  async function updateInspection(formData: FormData) {
    "use server"

    const parsed = updateInspectionSchema.parse({
      inspection_id: formData.get("inspection_id"),
      status: formData.get("status"),
      quantity_passed: formData.get("quantity_passed"),
      quantity_failed: formData.get("quantity_failed"),
      defect_description: formData.get("defect_description")?.toString(),
      corrective_action: formData.get("corrective_action")?.toString(),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const { error } = await serverSupabase
      .from("quality_inspections")
      .update({
        status: parsed.status,
        quantity_passed: parsed.quantity_passed,
        quantity_failed: parsed.quantity_failed,
        defect_description: parsed.defect_description || null,
        corrective_action: parsed.corrective_action || null,
        inspected_at: new Date().toISOString(),
      })
      .eq("id", parsed.inspection_id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/quality")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Quality Control</h1>
        <p className="text-sm text-muted-foreground">Capture inspections, NCRs, and corrective actions with traceability.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Raise Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInspection} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="product_id" required>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="work_order_id">
              <option value="">No work order</option>
              {workOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.wo_number}
                </option>
              ))}
            </select>
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="inspection_type" required>
              {inspectionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
            <Input min={0} name="quantity_inspected" placeholder="Qty inspected" type="number" required />
            <div className="md:col-span-4">
              <Button type="submit">Create Inspection</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Inspection Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inspections.map((inspection) => (
            <form action={updateInspection} className="rounded-xl border border-blue-200/45 p-3" key={inspection.id}>
              <input name="inspection_id" type="hidden" value={inspection.id} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{inspection.inspection_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {productMap.get(inspection.product_id)?.name ?? "Unknown"} · {workOrderMap.get(inspection.work_order_id ?? "")?.wo_number ?? "No WO"}
                  </p>
                </div>
                <Badge variant={inspection.status === "failed" ? "destructive" : "secondary"}>{inspection.status}</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" defaultValue={inspection.status} name="status">
                  {inspectionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <Input defaultValue={inspection.quantity_passed ?? 0} min={0} name="quantity_passed" placeholder="Qty passed" type="number" />
                <Input defaultValue={inspection.quantity_failed ?? 0} min={0} name="quantity_failed" placeholder="Qty failed" type="number" />
                <div className="text-xs text-muted-foreground">Inspected: {inspection.quantity_inspected}</div>
                <div className="md:col-span-2">
                  <Textarea defaultValue={inspection.defect_description ?? ""} name="defect_description" placeholder="Defect description / NCR" />
                </div>
                <div className="md:col-span-2">
                  <Textarea defaultValue={inspection.corrective_action ?? ""} name="corrective_action" placeholder="Corrective action" />
                </div>
                <div className="md:col-span-4">
                  <Button type="submit" variant="outline">Update Inspection</Button>
                </div>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Quality Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Total</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Passed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>On Hold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{inspections.length}</TableCell>
                <TableCell>{inspections.filter((item) => item.status === "pending").length}</TableCell>
                <TableCell>{inspections.filter((item) => item.status === "passed").length}</TableCell>
                <TableCell>{inspections.filter((item) => item.status === "failed").length}</TableCell>
                <TableCell>{inspections.filter((item) => item.status === "on_hold").length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
