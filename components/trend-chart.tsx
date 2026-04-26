"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINR } from "@/lib/format";
import { format, parseISO } from "date-fns";

export function TrendChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  const hasData = data.some((d) => d.total > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Last 30 days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {!hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No expenses in the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), "d MMM")}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(1, Math.floor(data.length / 6))}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickFormatter={(v) => formatCompactINR(v)}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                  labelFormatter={(d) => format(parseISO(d as string), "PPP")}
                  formatter={(v) => [formatINR(Number(v)), "Spent"]}
                  cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
