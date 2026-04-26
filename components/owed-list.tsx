"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OutstandingByPerson } from "@/lib/queries";

export function OwedList({ groups }: { groups: OutstandingByPerson[] }) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No outstanding splits. Everyone is settled up.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <PersonGroup key={g.personId} group={g} />
      ))}
    </div>
  );
}

function PersonGroup({ group }: { group: OutstandingByPerson }) {
  const [open, setOpen] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const markPaid = async (splitId: string) => {
    setBusyId(splitId);
    const supabase = createClient();
    const { error } = await supabase
      .from("transaction_splits")
      .update({ paid_at: new Date().toISOString() })
      .eq("id", splitId);
    setBusyId(null);
    if (error) {
      toast.error("Couldn't mark paid", { description: error.message });
      return;
    }
    toast.success("Marked paid");
    startTransition(() => router.refresh());
  };

  const settleAll = async () => {
    if (!confirm(`Mark all ${group.splits.length} splits from ${group.personName} as paid?`)) return;
    setBusyId("all");
    const supabase = createClient();
    const { error } = await supabase
      .from("transaction_splits")
      .update({ paid_at: new Date().toISOString() })
      .in("id", group.splits.map((s) => s.splitId));
    setBusyId(null);
    if (error) {
      toast.error("Couldn't settle", { description: error.message });
      return;
    }
    toast.success(`${group.personName} settled`);
    startTransition(() => router.refresh());
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            {open ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <span className="font-medium">{group.personName}</span>
            <span className="text-xs text-muted-foreground">
              {group.splits.length} item{group.splits.length === 1 ? "" : "s"}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold tabular-nums">
              {formatINR(group.total)}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={settleAll}
              disabled={busyId !== null || pending}
            >
              <Check className="size-3.5" />
              Settle all
            </Button>
          </div>
        </div>
        {open && (
          <ul className="border-t">
            {group.splits.map((s) => (
              <li
                key={s.splitId}
                className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.transaction.categoryColor ?? "#888" }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    {s.transaction.description || s.transaction.categoryName || "Expense"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(s.transaction.occurredOn), "d MMM yyyy")}
                    {" · "}
                    of {formatINR(s.transaction.totalAmount)}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatINR(s.amount)}
                </span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => markPaid(s.splitId)}
                  disabled={busyId !== null || pending}
                  className={cn(busyId === s.splitId && "opacity-50")}
                >
                  <Check className="size-3.5" />
                  Mark paid
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
