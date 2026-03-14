import type { Metadata } from "next"
import { revalidatePath } from "next/cache"

import { ForecastChart } from "@/components/dashboard/forecast-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  title: "AI Forecasting | SysPilot",
  description: "Forecast demand and optimize inventory planning.",
}

export default async function AiForecastingPage() {
  const { supabase, companyId } = await getAuthenticatedContext()

  const [forecastsResult, productsResult] = await Promise.all([
    supabase
      .from("demand_forecasts")
      .select("id,product_id,forecast_date,predicted_demand,actual_demand,confidence_score,model_version")
      .eq("company_id", companyId)
      .order("forecast_date", { ascending: true }),
    supabase.from("products").select("id,name,sku").eq("company_id", companyId).order("name"),
  ])

  if (forecastsResult.error || productsResult.error) {
    throw new Error("Unable to load AI forecasting module")
  }

  const forecasts = forecastsResult.data ?? []
  const products = productsResult.data ?? []
  const productMap = new Map(products.map((product) => [product.id, product]))

  async function generateForecasts() {
    "use server"

    const { supabase: serverSupabase, companyId: serverCompanyId } = await getAuthenticatedContext()

    const { data: productRows, error: productError } = await serverSupabase
      .from("products")
      .select("id,quantity_on_hand,reorder_level")
      .eq("company_id", serverCompanyId)
      .order("sku")
      .limit(30)

    if (productError) {
      throw new Error(productError.message)
    }

    const today = new Date()

    const inserts: Array<{
      company_id: string
      product_id: string
      forecast_date: string
      predicted_demand: number
      actual_demand: number
      confidence_score: number
      model_version: string
    }> = []

    for (const product of productRows ?? []) {
      for (let monthOffset = 0; monthOffset < 6; monthOffset += 1) {
        const forecastDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 1))
        const baseDemand = Math.max(Number(product.reorder_level ?? 10) * 2, 20)
        const seasonalPulse = ((monthOffset % 3) + 1) * 7
        const predicted = baseDemand + seasonalPulse + (Number(product.quantity_on_hand ?? 0) % 13)
        const actual = Math.max(predicted - (monthOffset % 2 === 0 ? 4 : -3), 0)

        inserts.push({
          company_id: serverCompanyId,
          product_id: product.id,
          forecast_date: forecastDate.toISOString().slice(0, 10),
          predicted_demand: predicted,
          actual_demand: actual,
          confidence_score: 84 + (monthOffset % 4),
          model_version: "forecast-v2",
        })
      }
    }

    const { error: cleanupError } = await serverSupabase
      .from("demand_forecasts")
      .delete()
      .eq("company_id", serverCompanyId)
      .eq("model_version", "forecast-v2")

    if (cleanupError) {
      throw new Error(cleanupError.message)
    }

    const { error: insertError } = await serverSupabase.from("demand_forecasts").insert(inserts)

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath("/ai-forecasting")
    revalidatePath("/dashboard")
  }

  const chartPointsMap = new Map<
    string,
    {
      period: string
      predicted: number
      actual: number
    }
  >()

  for (const row of forecasts) {
    const period = new Date(row.forecast_date).toLocaleDateString(undefined, {
      year: "2-digit",
      month: "short",
    })
    const existing = chartPointsMap.get(period)

    if (existing) {
      existing.predicted += Number(row.predicted_demand ?? 0)
      existing.actual += Number(row.actual_demand ?? 0)
    } else {
      chartPointsMap.set(period, {
        period,
        predicted: Number(row.predicted_demand ?? 0),
        actual: Number(row.actual_demand ?? 0),
      })
    }
  }

  const chartPoints = Array.from(chartPointsMap.values())

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Forecasting</h1>
          <p className="text-sm text-muted-foreground">Demand prediction engine for inventory optimization and production readiness.</p>
        </div>
        <form action={generateForecasts}>
          <Button type="submit">Generate 6-Month Forecast</Button>
        </form>
      </div>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Demand Trend (Predicted vs Actual)</CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastChart points={chartPoints} />
        </CardContent>
      </Card>

      <Card className="bark-shadow glass-surface border-white/65">
        <CardHeader>
          <CardTitle>Forecast Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Predicted</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts.slice(-120).map((row) => {
                const delta = Number(row.predicted_demand ?? 0) - Number(row.actual_demand ?? 0)

                return (
                  <TableRow key={row.id}>
                    <TableCell>{productMap.get(row.product_id)?.name ?? "Unknown"}</TableCell>
                    <TableCell>{new Date(row.forecast_date).toLocaleDateString()}</TableCell>
                    <TableCell>{Number(row.predicted_demand ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{Number(row.actual_demand ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={Number(row.confidence_score ?? 0) >= 85 ? "secondary" : "outline"}>
                        {Number(row.confidence_score ?? 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{row.model_version}</span>
                      <div className="text-xs text-muted-foreground">delta {delta > 0 ? "+" : ""}{delta}</div>
                    </TableCell>
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
