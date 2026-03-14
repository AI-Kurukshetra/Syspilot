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
  title: "Sales | SysPilot",
  description: "Create and track customer sales orders.",
}

const salesStatuses = [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "invoiced",
  "cancelled",
] as const

const createSalesOrderSchema = z.object({
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().positive(),
})

const updateSalesStatusSchema = z.object({
  sales_order_id: z.string().uuid(),
  status: z.enum(salesStatuses),
})

export default async function SalesPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [customersResult, productsResult, salesOrdersResult] = await Promise.all([
    supabase.from("customers").select("id,name,code").eq("company_id", companyId).order("name"),
    supabase.from("products").select("id,name,sku,selling_price").eq("company_id", companyId).order("name"),
    supabase
      .from("sales_orders")
      .select("id,order_number,customer_id,status,total_amount,order_date")
      .eq("company_id", companyId)
      .order("order_date", { ascending: false }),
  ])

  if (customersResult.error || productsResult.error || salesOrdersResult.error) {
    throw new Error("Unable to load sales module")
  }

  const customers = customersResult.data ?? []
  const products = productsResult.data ?? []
  const salesOrders = salesOrdersResult.data ?? []

  const customerMap = new Map(customers.map((customer) => [customer.id, customer]))

  async function createSalesOrder(formData: FormData) {
    "use server"

    const parsed = createSalesOrderSchema.parse({
      customer_id: formData.get("customer_id"),
      product_id: formData.get("product_id"),
      quantity: formData.get("quantity"),
      unit_price: formData.get("unit_price"),
    })

    const { supabase: serverSupabase, companyId: serverCompanyId, user: serverUser } =
      await getAuthenticatedContext()

    const orderNumber = `SO-${Date.now()}`
    const subtotal = parsed.quantity * parsed.unit_price
    const taxRate = 10
    const taxAmount = subtotal * (taxRate / 100)
    const totalAmount = subtotal + taxAmount

    const { data: orderRow, error: orderError } = await serverSupabase
      .from("sales_orders")
      .insert({
        company_id: serverCompanyId,
        order_number: orderNumber,
        customer_id: parsed.customer_id,
        status: "draft",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        created_by: serverUser.id,
      })
      .select("id")
      .single()

    if (orderError || !orderRow) {
      throw new Error(orderError?.message ?? "Unable to create sales order")
    }

    const { error: lineError } = await serverSupabase.from("sales_order_lines").insert({
      sales_order_id: orderRow.id,
      product_id: parsed.product_id,
      quantity: parsed.quantity,
      unit_price: parsed.unit_price,
      line_total: subtotal,
      sort_order: 1,
    })

    if (lineError) {
      throw new Error(lineError.message)
    }

    revalidatePath("/sales")
    revalidatePath("/dashboard")
    revalidatePath("/finance")
  }

  async function updateSalesStatus(formData: FormData) {
    "use server"

    const parsed = updateSalesStatusSchema.parse({
      sales_order_id: formData.get("sales_order_id"),
      status: formData.get("status"),
    })

    const { supabase: serverSupabase } = await getAuthenticatedContext()

    const { error: updateError } = await serverSupabase
      .from("sales_orders")
      .update({ status: parsed.status })
      .eq("id", parsed.sales_order_id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidatePath("/sales")
    revalidatePath("/dashboard")
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sales Orders</h1>
        <p className="text-sm text-muted-foreground">Create orders, track lifecycle status, and keep customer commitments visible.</p>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Create Sales Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSalesOrder} className="grid gap-3 md:grid-cols-4">
            <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" name="customer_id" required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.code})
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

            <Input min={1} name="quantity" placeholder="Qty" type="number" required />
            <Input min={0.01} name="unit_price" placeholder="Unit price" step="0.01" type="number" required />
            <div className="md:col-span-4">
              <Button type="submit">Create Sales Order</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{customerMap.get(order.customer_id)?.name ?? "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(order.total_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <form action={updateSalesStatus} className="flex items-center gap-2">
                      <input name="sales_order_id" type="hidden" value={order.id} />
                      <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs" name="status" defaultValue={order.status}>
                        {salesStatuses.map((status) => (
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
