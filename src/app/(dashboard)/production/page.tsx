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
import { getAuthenticatedContext } from "@/lib/supabase/context"

export const metadata: Metadata = {
  title: "Production | SysPilot",
  description: "Plan and track work orders.",
}

const workOrderStatuses = ["planned", "released", "in_progress", "completed", "cancelled"] as const
const priorities = ["low", "medium", "high", "urgent"] as const

const createWorkOrderSchema = z.object({
  product_id: z.string().uuid(),
  quantity_planned: z.coerce.number().int().positive(),
  priority: z.enum(priorities),
})

const updateWorkOrderSchema = z.object({
  work_order_id: z.string().uuid(),
  status: z.enum(workOrderStatuses),
})

export default async function ProductionPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [productsResult, workOrdersResult] = await Promise.all([
    supabase.from("products").select("id,name,sku").eq("company_id", companyId).order("name"),
    supabase
      .from("work_orders")
      .select("id,wo_number,product_id,status,priority,quantity_planned,quantity_completed,planned_start,planned_end")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ])

  if (productsResult.error || workOrdersResult.error) {
    throw new Error("Unable to load production module")
  }

  const products = productsResult.data ?? []
  const workOrders = workOrdersResult.data ?? []
  const productMap = new Map(products.map((product) => [product.id, product]))

  async function createWorkOrder(formData: FormData) {
    "use server"

    const parsed = createWorkOrderSchema.parse({
      product_id: formData.get("product_id"),
      quantity_planned: formData.get("quantity_planned"),
      priority: formData.get("priority"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } =
      await getAuthenticatedContext()

    const now = new Date()
    const plannedEnd = new Date(now)
    plannedEnd.setDate(plannedEnd.getDate() + 7)

    const { error: insertError } = await serverSupabase.from("work_orders").insert({
      company_id: serverCompanyId,
      wo_number: `WO-${Date.now()}`,
      product_id: parsed.product_id,
      status: "planned",
      priority: parsed.priority,
      quantity_planned: parsed.quantity_planned,
      quantity_completed: 0,
      planned_start: now.toISOString(),
      planned_end: plannedEnd.toISOString(),
      created_by: serverUser.id,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath("/production")
    revalidatePath("/dashboard")
  }

  async function updateWorkOrderStatus(formData: FormData) {
    "use server"

    const parsed = updateWorkOrderSchema.parse({
      work_order_id: formData.get("work_order_id"),
      status: formData.get("status"),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const updatePayload: {
      status: (typeof workOrderStatuses)[number]
      actual_start?: string
      actual_end?: string
      quantity_completed?: number
    } = { status: parsed.status }

    if (parsed.status === "in_progress") {
      updatePayload.actual_start = new Date().toISOString()
    }

    if (parsed.status === "completed") {
      const { data: currentOrder } = await serverSupabase
        .from("work_orders")
        .select("quantity_planned")
        .eq("id", parsed.work_order_id)
        .single()

      updatePayload.actual_end = new Date().toISOString()
      updatePayload.quantity_completed = currentOrder?.quantity_planned ?? 0
    }

    const { error: updateError } = await serverSupabase
      .from("work_orders")
      .update(updatePayload)
      .eq("id", parsed.work_order_id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidatePath("/production")
    revalidatePath("/dashboard")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Production Planning</h1>
        <p className="text-sm text-muted-foreground">Release work orders and control shop-floor execution.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Create Work Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createWorkOrder} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="product_id" required>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>

            <Input min={1} name="quantity_planned" placeholder="Planned qty" type="number" required />

            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="priority" required>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <div>
              <Button type="submit">Create Work Order</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Work Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.wo_number}</TableCell>
                  <TableCell>{productMap.get(order.product_id)?.name ?? "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant={order.priority === "urgent" ? "destructive" : "secondary"}>{order.priority}</Badge>
                  </TableCell>
                  <TableCell>{order.status.replace("_", " ")}</TableCell>
                  <TableCell>
                    {order.quantity_completed}/{order.quantity_planned}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.planned_start ? new Date(order.planned_start).toLocaleDateString() : "-"} -{" "}
                    {order.planned_end ? new Date(order.planned_end).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <form action={updateWorkOrderStatus} className="flex items-center gap-2">
                      <input name="work_order_id" type="hidden" value={order.id} />
                      <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs" name="status" defaultValue={order.status}>
                        {workOrderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" type="submit" variant="outline">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
