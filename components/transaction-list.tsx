"use client";

import { useState } from "react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icon";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
import { formatINR } from "@/lib/format";
import type { TransactionWithCategory } from "@/types/database";

function dayLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM");
}

export function TransactionList({
  transactions,
  emptyHint,
}: {
  transactions: TransactionWithCategory[];
  emptyHint?: string;
}) {
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyHint ?? "No transactions yet."}
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, TransactionWithCategory[]>();
  for (const t of transactions) {
    const key = t.occurred_on;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }

  return (
    <>
      <div className="space-y-4">
        {[...groups.entries()].map(([day, items]) => {
          const dayTotal = items.reduce((acc, t) => acc + Number(t.amount), 0);
          return (
            <div key={day}>
              <div className="flex items-baseline justify-between px-1 pb-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dayLabel(day)}
                </div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {formatINR(dayTotal)}
                </div>
              </div>
              <Card>
                <CardContent className="divide-y px-0">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setEditing(t)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <CategoryIcon
                        icon={t.category?.icon}
                        color={t.category?.color}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {t.description?.trim() || t.category?.name || "Expense"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.category?.name ?? "Uncategorized"}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold tabular-nums">
                        {formatINR(Number(t.amount))}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <TransactionEditSheet
        transaction={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
