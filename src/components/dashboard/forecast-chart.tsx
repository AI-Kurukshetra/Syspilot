"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type ForecastPoint = {
  period: string
  predicted: number
  actual: number
}

type ForecastChartProps = {
  points: ForecastPoint[]
}

export function ForecastChart({ points }: ForecastChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={points}>
          <defs>
            <linearGradient id="predictedFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#315fbf" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#315fbf" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#cdd8ea" strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Area dataKey="predicted" fill="url(#predictedFill)" stroke="#315fbf" strokeWidth={2} type="monotone" />
          <Area dataKey="actual" fill="url(#actualFill)" stroke="#0ea5a4" strokeWidth={2} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
