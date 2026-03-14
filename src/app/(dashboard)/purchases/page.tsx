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
  title: "Purchases | SysPilot",
  description: "Manage suppliers, purchase orders, and receiving.",
}

const purchaseStatuses = ["draft", "sent", "acknowledged", "partially_received", "received", "cancelled"] as const

const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity_ordered: z.coerce.number().int().positive(),
  unit_cost: z.coerce.number().positive(),
})

const updatePurchaseStatusSchema = z.object({
  purchase_order_id: z.string().uuid(),
  status: z.enum(purchaseStatuses),
})

const receiveLineSchema = z.object({
  purchase_order_id: z.string().uuid(),
})

export default async function PurchasesPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [suppliersResult, productsResult, purchaseOrdersResult] = await Promise.all([
    supabase.from("suppliers").select("id,name,code").eq("company_id", companyId).order("name"),
    supabase.from("products").select("id,name,sku").eq("company_id", companyId).order("name"),
    supabase
      .from("purchase_orders")
      .select("id,po_number,supplier_id,status,total_amount,order_date")
      .eq("company_id", companyId)
      .order("order_date", { ascending: false }),
  ])

  if (suppliersResult.error || productsResult.error || purchaseOrdersResult.error) {
    throw new Error("Unable to load purchase module")
  }

  const suppliers = suppliersResult.data ?? []
  const products = productsResult.data ?? []
  const purchaseOrders = purchaseOrdersResult.data ?? []

  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]))

  async function createPurchaseOrder(formData: FormData) {
    "use server"

    const parsed = createPurchaseOrderSchema.parse({
      supplier_id: formData.get("supplier_id"),
      product_id: formData.get("product_id"),
      quantity_ordered: formData.get("quantity_ordered"),
      unit_cost: formData.get("unit_cost"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } =
      await getAuthenticatedContext()

    const poNumber = `PO-${Date.now()}`
    const subtotal = parsed.quantity_ordered * parsed.unit_cost
    const taxRate = 10
    const taxAmount = subtotal * (taxRate / 100)
    const totalAmount = subtotal + taxAmount

    const { data: poRow, error: poError } = await serverSupabase
      .from("purchase_orders")
      .insert({
        company_id: serverCompanyId,
        po_number: poNumber,
        supplier_id: parsed.supplier_id,
        status: "draft",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        created_by: serverUser.id,
      })
      .select("id")
      .single()

    if (poError || !poRow) {
      throw new Error(poError?.message ?? "Unable to create purchase order")
    }

    const { error: lineError } = await serverSupabase.from("purchase_order_lines").insert({
      purchase_order_id: poRow.id,
      product_id: parsed.product_id,
      quantity_ordered: parsed.quantity_ordered,
      quantity_received: 0,
      unit_cost: parsed.unit_cost,
      line_total: subtotal,
      sort_order: 1,
    })

    if (lineError) {
      throw new Error(lineError.message)
    }

    revalidatePath("/purchases")
    revalidatePath("/dashboard")
    revalidatePath("/finance")
  }

  async function updatePurchaseStatus(formData: FormData) {
    "use server"

    const parsed = updatePurchaseStatusSchema.parse({
      purchase_order_id: formData.get("purchase_order_id"),
      status: formData.get("status"),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const { error: updateError } = await serverSupabase
      .from("purchase_orders")
      .update({ status: parsed.status })
      .eq("id", parsed.purchase_order_id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidatePath("/purchases")
    revalidatePath("/dashboard")
  }

  async function receiveOrder(formData: FormData) {
    "use server"

    const parsed = receiveLineSchema.parse({
      purchase_order_id: formData.get("purchase_order_id"),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const { data: lines, error: linesError } = await serverSupabase
      .from("purchase_order_lines")
      .select("id,quantity_ordered")
      .eq("purchase_order_id", parsed.purchase_order_id)

    if (linesError) {
      throw new Error(linesError.message)
    }

    for (const line of lines ?? []) {
      const { error: updateLineError } = await serverSupabase
        .from("purchase_order_lines")
        .update({ quantity_received: line.quantity_ordered })
        .eq("id", line.id)

      if (updateLineError) {
        throw new Error(updateLineError.message)
      }
    }

    const { error: updateOrderError } = await serverSupabase
      .from("purchase_orders")
      .update({ status: "received", received_date: new Date().toISOString() })
      .eq("id", parsed.purchase_order_id)

    if (updateOrderError) {
      throw new Error(updateOrderError.message)
    }

    revalidatePath("/purchases")
    revalidatePath("/dashboard")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">Raise procurement orders and receive materials into stock.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPurchaseOrder} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="supplier_id" required>
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>

            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="product_id" required>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>

            <Input min={1} name="quantity_ordered" placeholder="Qty" type="number" required />
            <Input min={0.01} name="unit_cost" placeholder="Unit cost" step="0.01" type="number" required />
            <div className="md:col-span-4">
              <Button type="submit">Create Purchase Order</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Procurement Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.po_number}</TableCell>
                  <TableCell>{supplierMap.get(order.supplier_id)?.name ?? "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(order.total_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell className="space-y-2">
                    <form action={updatePurchaseStatus} className="flex items-center gap-2">
                      <input name="purchase_order_id" type="hidden" value={order.id} />
                      <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs" name="status" defaultValue={order.status}>
                        {purchaseStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" type="submit" variant="outline">
                        Save
                      </Button>
                    </form>
                    <form action={receiveOrder}>
                      <input name="purchase_order_id" type="hidden" value={order.id} />
                      <Button size="sm" type="submit" variant="secondary">
                        Receive
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
