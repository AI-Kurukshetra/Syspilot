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
  title: "BOM | SysPilot",
  description: "Manage multi-level bill of materials and components.",
}

const createBomSchema = z.object({
  product_id: z.string().uuid(),
  bom_name: z.string().min(3),
  version: z.string().min(1),
})

const addBomLineSchema = z.object({
  bom_id: z.string().uuid(),
  component_id: z.string().uuid(),
  quantity_required: z.coerce.number().positive(),
})

export default async function BomPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [productsResult, bomsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,sku,category,total_unit_cost")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("bill_of_materials")
      .select("id,bom_name,version,status,product_id,total_cost,created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ])

  if (productsResult.error || bomsResult.error) {
    throw new Error("Unable to load BOM module")
  }

  const products = productsResult.data ?? []
  const boms = bomsResult.data ?? []
  const bomIds = boms.map((bom) => bom.id)

  let bomLines: Array<{
    id: string
    bom_id: string
    component_id: string
    quantity_required: number
    unit_cost: number | null
  }> = []

  if (bomIds.length > 0) {
    const { data: linesData, error: linesError } = await supabase
      .from("bom_lines")
      .select("id,bom_id,component_id,quantity_required,unit_cost")
      .in("bom_id", bomIds)
      .order("sort_order")

    if (linesError) {
      throw new Error("Unable to load BOM lines")
    }

    bomLines = linesData ?? []
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  const linesByBom = new Map<string, typeof bomLines>()

  for (const line of bomLines) {
    const existing = linesByBom.get(line.bom_id) ?? []
    existing.push(line)
    linesByBom.set(line.bom_id, existing)
  }

  async function createBom(formData: FormData) {
    "use server"

    const parsed = createBomSchema.parse({
      product_id: formData.get("product_id"),
      bom_name: formData.get("bom_name"),
      version: formData.get("version"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } = await getAuthenticatedContext()

    const { error } = await serverSupabase.from("bill_of_materials").insert({
      company_id: serverCompanyId,
      product_id: parsed.product_id,
      bom_name: parsed.bom_name,
      version: parsed.version,
      status: "active",
      created_by: serverUser.id,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/bom")
  }

  async function addBomLine(formData: FormData) {
    "use server"

    const parsed = addBomLineSchema.parse({
      bom_id: formData.get("bom_id"),
      component_id: formData.get("component_id"),
      quantity_required: formData.get("quantity_required"),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const { data: component } = await serverSupabase
      .from("products")
      .select("unit_cost")
      .eq("id", parsed.component_id)
      .single()

    const unitCost = Number(component?.unit_cost ?? 0)

    const { error: lineError } = await serverSupabase.from("bom_lines").insert({
      bom_id: parsed.bom_id,
      component_id: parsed.component_id,
      quantity_required: parsed.quantity_required,
      unit_cost: unitCost,
      sort_order: Date.now() % 100000,
    })

    if (lineError) {
      throw new Error(lineError.message)
    }

    const { data: linesForBom } = await serverSupabase
      .from("bom_lines")
      .select("quantity_required,unit_cost")
      .eq("bom_id", parsed.bom_id)

    const totalMaterialCost = (linesForBom ?? []).reduce(
      (sum, line) => sum + Number(line.quantity_required) * Number(line.unit_cost ?? 0),
      0
    )

    const { error: updateError } = await serverSupabase
      .from("bill_of_materials")
      .update({
        total_material_cost: totalMaterialCost,
        total_cost: totalMaterialCost,
      })
      .eq("id", parsed.bom_id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidatePath("/bom")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bill of Materials</h1>
        <p className="text-sm text-muted-foreground">Define multi-level product structures and maintain component costs.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Create BOM Header</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBom} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="product_id" required>
              <option value="">Select parent product</option>
              {products
                .filter((product) => product.category === "finished_good" || product.category === "wip")
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
            </select>
            <Input name="bom_name" placeholder="BOM name" required />
            <Input defaultValue="1.0" name="version" placeholder="Version" required />
            <Button type="submit">Create BOM</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Add BOM Component</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addBomLine} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="bom_id" required>
              <option value="">Select BOM</option>
              {boms.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  {bom.bom_name} v{bom.version}
                </option>
              ))}
            </select>
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="component_id" required>
              <option value="">Select component</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <Input min={0.01} name="quantity_required" placeholder="Qty required" step="0.01" type="number" required />
            <Button type="submit">Add Component</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Active BOM Structures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {boms.map((bom) => {
            const parent = productMap.get(bom.product_id)
            const lines = linesByBom.get(bom.id) ?? []

            return (
              <div className="rounded-xl border border-blue-200/45 p-3" key={bom.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{bom.bom_name} v{bom.version}</p>
                    <p className="text-xs text-muted-foreground">
                      Parent: {parent?.name ?? "Unknown"} ({parent?.sku ?? "-"})
                    </p>
                  </div>
                  <Badge>{bom.status}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => {
                      const component = productMap.get(line.component_id)

                      return (
                        <TableRow key={line.id}>
                          <TableCell>{component?.name ?? "Unknown component"}</TableCell>
                          <TableCell>{component?.sku ?? "-"}</TableCell>
                          <TableCell>{Number(line.quantity_required).toLocaleString()}</TableCell>
                          <TableCell>${Number(line.unit_cost ?? 0).toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <p className="mt-2 text-xs text-muted-foreground">Total cost: ${Number(bom.total_cost ?? 0).toLocaleString()}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </main>
  )
}
