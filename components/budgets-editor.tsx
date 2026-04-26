"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatINR, startOfMonthISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { BudgetProgress } from "@/lib/queries";

export function BudgetsEditor({ budgets }: { budgets: BudgetProgress[] }) {
  return (
    <div className="space-y-3">
      {budgets.map((b) => (
        <BudgetRow key={b.categoryId} budget={b} />
      ))}
    </div>
  );
}

function BudgetRow({ budget }: { budget: BudgetProgress }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget.monthlyLimit || ""));
  const [busy, setBusy] = useState(false);

  const limit = budget.monthlyLimit;
  const spent = budget.spent;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a non-negative number");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("budgets").upsert(
      {
        category_id: budget.categoryId,
        monthly_limit: n,
        effective_from: startOfMonthISO(),
      },
      { onConflict: "category_id,effective_from" },
    );
    setBusy(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success("Budget updated");
    setEditing(false);
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: budget.color ?? "#888" }}
          />
          <div className="min-w-0 flex-1 truncate text-sm font-medium">
            {budget.categoryName}
          </div>
          {!editing ? (
            <>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatINR(spent)}
                {limit > 0 && (
                  <>
                    {" "}/ <span className="text-foreground">{formatINR(limit)}</span>
                  </>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                aria-label="Edit budget"
              >
                <Pencil className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="h-9 w-28"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") {
                    setEditing(false);
                    setValue(String(budget.monthlyLimit || ""));
                  }
                }}
              />
              <Button size="icon" onClick={save} disabled={busy} aria-label="Save">
                <Check className="size-4" />
              </Button>
            </>
          )}
        </div>
        {limit > 0 && (
          <Progress
            value={pct}
            className={cn("h-1.5", over && "[&>*]:bg-destructive")}
          />
        )}
      </CardContent>
    </Card>
  );
}
