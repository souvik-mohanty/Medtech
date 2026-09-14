import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { CategoryShare } from "@/types"

export function PopularTestsChart({ data }: { data: CategoryShare[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={110} />
        <Tooltip
          formatter={(value) => [value, "Bookings"]}
          contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 12 }}
        />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
