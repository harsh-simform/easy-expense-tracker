"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, ChevronDown, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import { useCategories } from "@/components/categories-provider";
import { SplitInput, type SplitDraft } from "@/components/split-input";
import type { TransactionWithCategory } from "@/types/database";

export function TransactionEditSheet({
  transaction,
  onClose,
}: {
  transaction: TransactionWithCategory | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <Sheet open={!!transaction} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full overflow-y-auto sm:max-w-md"
            : "max-h-[90dvh] overflow-y-auto"
        }
      >
        <SheetHeader>
          <SheetTitle>Edit expense</SheetTitle>
          <SheetDescription>Change amount, category, or date.</SheetDescription>
        </SheetHeader>
        {transaction && (
          // Re-mount the form when a different transaction is selected so its
          // state is initialized from props once, no setState-in-effect needed.
          <EditForm key={transaction.id} transaction={transaction} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  transaction,
  onClose,
}: {
  transaction: TransactionWithCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const categories = useCategories();
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [date, setDate] = useState<Date>(parseISO(transaction.occurred_on));
  const [busy, setBusy] = useState(false);
  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const [splits, setSplits] = useState<SplitDraft[]>(
    (transaction.splits ?? []).map((s) => ({
      id: s.id,
      personId: s.person?.id ?? null,
      name: s.person?.name ?? "(removed)",
      amount: Number(s.amount),
      paidAt: s.paid_at,
    })),
  );

  const togglePaid = async (split: SplitDraft, paid: boolean) => {
    if (!split.id) return;
    const supabase = createClient();
    const paid_at = paid ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("transaction_splits")
      .update({ paid_at })
      .eq("id", split.id);
    if (error) {
      toast.error("Couldn't update", { description: error.message });
      return;
    }
    setSplits((prev) =>
      prev.map((s) => (s.id === split.id ? { ...s, paidAt: paid_at } : s)),
    );
    toast.success(paid ? "Marked paid" : "Marked unpaid");
    router.refresh();
  };

  const handleSave = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!categoryId) {
      toast.error("Pick a category");
      return;
    }
    const splitsTotal = splits.reduce((acc, s) => acc + s.amount, 0);
    if (splitsTotal > amt + 0.01) {
      toast.error("Splits exceed the total");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update({
        amount: amt,
        description: description.trim() || null,
        category_id: categoryId,
        occurred_on: format(date, "yyyy-MM-dd"),
      })
      .eq("id", transaction.id);
    if (error) {
      setBusy(false);
      toast.error("Couldn't update", { description: error.message });
      return;
    }

    // Diff splits: delete removed rows, upsert kept/new ones. New names that
    // don't exist in `people` yet get inserted first.
    const originalIds = new Set(
      (transaction.splits ?? []).map((s) => s.id),
    );
    const keptIds = new Set(
      splits.filter((s) => s.id).map((s) => s.id as string),
    );
    const toDelete = [...originalIds].filter((id) => !keptIds.has(id));
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("transaction_splits")
        .delete()
        .in("id", toDelete);
      if (delErr) {
        setBusy(false);
        toast.error("Couldn't update splits", { description: delErr.message });
        return;
      }
    }

    const newNames = splits.filter((s) => !s.personId).map((s) => s.name);
    let nameToId = new Map<string, string>();
    if (newNames.length > 0) {
      const { data: created, error: peopleErr } = await supabase
        .from("people")
        .upsert(
          newNames.map((name) => ({ name })),
          { onConflict: "owner_email,name" },
        )
        .select("id, name");
      if (peopleErr) {
        setBusy(false);
        toast.error("Couldn't save people", { description: peopleErr.message });
        return;
      }
      nameToId = new Map((created ?? []).map((p) => [p.name, p.id]));
    }

    // Update existing rows (amount may have changed) and insert new ones.
    const existing = splits.filter((s) => s.id);
    const fresh = splits.filter((s) => !s.id && s.amount > 0);
    if (existing.length > 0) {
      for (const s of existing) {
        const { error: upErr } = await supabase
          .from("transaction_splits")
          .update({ amount: s.amount })
          .eq("id", s.id!);
        if (upErr) {
          setBusy(false);
          toast.error("Couldn't update split", { description: upErr.message });
          return;
        }
      }
    }
    if (fresh.length > 0) {
      const { error: insErr } = await supabase.from("transaction_splits").insert(
        fresh.map((s) => ({
          transaction_id: transaction.id,
          person_id: s.personId ?? nameToId.get(s.name)!,
          amount: s.amount,
          paid_at: s.paidAt,
        })),
      );
      if (insErr) {
        setBusy(false);
        toast.error("Couldn't save splits", { description: insErr.message });
        return;
      }
    }

    setBusy(false);
    toast.success("Updated");
    onClose();
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't delete", { description: error.message });
      return;
    }
    toast.success("Deleted");
    onClose();
    router.refresh();
  };

  return (
    <>
      <div className="space-y-4 px-4 pb-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs">
            Amount (₹)
          </Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc" className="text-xs">
            Description
          </Label>
          <Input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <div className="relative">
            {selectedCategory && (
              <span
                className="pointer-events-none absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: selectedCategory.color ?? "#888" }}
              />
            )}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={cn(
                "h-9 w-full appearance-none rounded-lg border border-input bg-transparent pr-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                selectedCategory ? "pl-7" : "pl-2.5",
              )}
            >
              {!categoryId && (
                <option value="" disabled>
                  Select category
                </option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="w-full justify-start font-normal" />
              }
            >
              <CalendarIcon className="size-4" />
              {format(date, "PPP")}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <SplitInput
          total={Number(amount) || 0}
          value={splits}
          onChange={setSplits}
          onTogglePaid={togglePaid}
        />
      </div>
      <SheetFooter className="flex-row gap-2">
        <Button
          variant="ghost"
          className="text-destructive"
          onClick={handleDelete}
          disabled={busy}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}
