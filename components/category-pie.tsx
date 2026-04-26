"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/queries";

const FALLBACK_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#ec4899", "#eab308", "#8b5cf6", "#ef4444", "#a855f7", "#06b6d4", "#64748b"];

export function CategoryPie({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          No expenses this month yet.
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="categoryName"
                  innerRadius={50}
                  outerRadius={85}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={entry.categoryId ?? idx}
                      fill={entry.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v) => formatINR(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5">
            {data.slice(0, 6).map((d, idx) => (
              <li
                key={d.categoryId ?? idx}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: d.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
                  />
                  <span className="truncate">{d.categoryName}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round((d.total / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
