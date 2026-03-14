"use client"

import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type OrdersByStatus = {
  status: string
  count: number
}

type TransactionsByType = {
  type: string
  amount: number
}

type AnalyticsOverviewProps = {
  ordersByStatus: OrdersByStatus[]
  transactionsByType: TransactionsByType[]
}

const pieColors = ["#0f172a", "#0891b2", "#059669", "#dc2626", "#d97706"]

export function AnalyticsOverview({ ordersByStatus, transactionsByType }: AnalyticsOverviewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bark-shadow glass-surface border-white/60">
        <CardHeader>
          <CardTitle>Sales Orders by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cdd8ea" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#315fbf" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/60">
        <CardHeader>
          <CardTitle>Transaction Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={transactionsByType}
                dataKey="amount"
                nameKey="type"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {transactionsByType.map((entry, index) => (
                  <Cell key={entry.type} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0)
                  return `$${numericValue.toLocaleString()}`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
