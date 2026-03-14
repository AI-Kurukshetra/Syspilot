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
  title: "Inventory | SysPilot",
  description: "Manage product stock and reorder controls.",
}

const createProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  category: z.enum(["raw_material", "wip", "finished_good", "component", "consumable"]),
  quantity_on_hand: z.coerce.number().int().nonnegative(),
  reorder_level: z.coerce.number().int().nonnegative(),
  unit_cost: z.coerce.number().nonnegative(),
})

export default async function InventoryPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const { data: products, error } = await supabase
    .from("products")
    .select("id, sku, name, category, quantity_on_hand, reorder_level, unit_cost")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Unable to load inventory")
  }

  async function createProduct(formData: FormData) {
    "use server"

    const parsed = createProductSchema.parse({
      sku: formData.get("sku"),
      name: formData.get("name"),
      category: formData.get("category"),
      quantity_on_hand: formData.get("quantity_on_hand"),
      reorder_level: formData.get("reorder_level"),
      unit_cost: formData.get("unit_cost"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId } = await getAuthenticatedContext()

    const { error: insertError } = await serverSupabase.from("products").insert({
      company_id: serverCompanyId,
      sku: parsed.sku,
      name: parsed.name,
      category: parsed.category,
      unit_of_measure: "EA",
      quantity_on_hand: parsed.quantity_on_hand,
      reorder_level: parsed.reorder_level,
      reorder_quantity: Math.max(parsed.reorder_level * 2, 1),
      unit_cost: parsed.unit_cost,
      selling_price: parsed.unit_cost * 1.35,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath("/inventory")
    revalidatePath("/dashboard")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Create products and monitor stock positions with reorder alerts.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="grid gap-3 md:grid-cols-3">
            <Input name="sku" placeholder="SKU" required />
            <Input name="name" placeholder="Product name" required />
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              name="category"
              required
            >
              <option value="raw_material">Raw Material</option>
              <option value="wip">WIP</option>
              <option value="finished_good">Finished Good</option>
              <option value="component">Component</option>
              <option value="consumable">Consumable</option>
            </select>
            <Input min={0} name="quantity_on_hand" placeholder="On hand" type="number" required />
            <Input min={0} name="reorder_level" placeholder="Reorder level" type="number" required />
            <Input min={0} name="unit_cost" placeholder="Unit cost" step="0.01" type="number" required />
            <div className="md:col-span-3">
              <Button type="submit">Create Product</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Stock Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>On Hand</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Unit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => {
                const isLowStock = product.quantity_on_hand <= product.reorder_level

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="capitalize">{product.category.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={isLowStock ? "destructive" : "secondary"}>{product.quantity_on_hand}</Badge>
                    </TableCell>
                    <TableCell>{product.reorder_level}</TableCell>
                    <TableCell>${Number(product.unit_cost).toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
