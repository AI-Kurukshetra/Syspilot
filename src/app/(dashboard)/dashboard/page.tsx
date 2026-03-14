import type { Metadata } from "next"

import { AnalyticsOverview } from "@/components/dashboard/analytics-overview"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthenticatedContext } from "@/lib/supabase/context"

export const metadata: Metadata = {
  title: "Analytics Dashboard | SysPilot",
  description: "KPI overview for operations, orders, and finance.",
}

type OrderStatusRow = {
  status: string
}

type TransactionRow = {
  type: string
  amount: number
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export default async function DashboardPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [
    productsResult,
    salesResult,
    purchaseResult,
    workOrderResult,
    transactionResult,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    supabase.from("sales_orders").select("status,total_amount").eq("company_id", companyId),
    supabase.from("purchase_orders").select("status,total_amount").eq("company_id", companyId),
    supabase.from("work_orders").select("status").eq("company_id", companyId),
    supabase.from("transactions").select("type,amount").eq("company_id", companyId),
  ])

  if (salesResult.error || purchaseResult.error || workOrderResult.error || transactionResult.error) {
    throw new Error("Unable to load dashboard analytics")
  }

  const salesOrders = salesResult.data ?? []
  const purchaseOrders = purchaseResult.data ?? []
  const workOrders = workOrderResult.data ?? []
  const transactions = (transactionResult.data ?? []) as TransactionRow[]

  const salesOrderMap = new Map<string, number>()
  for (const row of salesOrders as OrderStatusRow[]) {
    salesOrderMap.set(row.status, (salesOrderMap.get(row.status) ?? 0) + 1)
  }

  const ordersByStatus = Array.from(salesOrderMap.entries()).map(([status, count]) => ({
    status,
    count,
  }))

  const transactionMap = new Map<string, number>()
  for (const row of transactions) {
    transactionMap.set(row.type, (transactionMap.get(row.type) ?? 0) + Number(row.amount ?? 0))
  }

  const transactionsByType = Array.from(transactionMap.entries()).map(([type, amount]) => ({
    type,
    amount,
  }))

  const salesTotal = sum((salesOrders as Array<{ total_amount: number | null }>).map((row) => Number(row.total_amount ?? 0)))
  const purchaseTotal = sum(
    (purchaseOrders as Array<{ total_amount: number | null }>).map((row) => Number(row.total_amount ?? 0))
  )

  const kpis = [
    {
      label: "Products",
      value: String(productsResult.count ?? 0),
      helper: "Active catalog items",
    },
    {
      label: "Sales Orders",
      value: String(salesOrders.length),
      helper: "Across all statuses",
    },
    {
      label: "Purchase Orders",
      value: String(purchaseOrders.length),
      helper: "Inbound procurement",
    },
    {
      label: "Work Orders",
      value: String(workOrders.length),
      helper: "Planned and active production",
    },
    {
      label: "Sales Value",
      value: `$${salesTotal.toLocaleString()}`,
      helper: "Total sales order amount",
    },
    {
      label: "Spend Value",
      value: `$${purchaseTotal.toLocaleString()}`,
      helper: "Total purchase order amount",
    },
  ]

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
          <p className="text-sm text-slate-600">Real-time pulse across inventory, sales, purchasing, and finance.</p>
        </div>
        <Badge className="bg-blue-700/90 text-white" variant="secondary">Live ERP Snapshot</Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <Card className="bark-shadow glass-surface border-white/65" key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <AnalyticsOverview ordersByStatus={ordersByStatus} transactionsByType={transactionsByType} />
    </main>
  )
}
