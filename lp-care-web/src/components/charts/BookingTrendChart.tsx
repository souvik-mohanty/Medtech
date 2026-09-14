import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { BookingTrendPoint } from "@/types"

export function BookingTrendChart({ data }: { data: BookingTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
        <Tooltip
          formatter={(value) => [value, "Bookings"]}
          contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 12 }}
        />
        <Bar dataKey="bookings" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
