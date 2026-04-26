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
import { useCategories } from "@/components/categories-provider";
import type { TransactionWithCategory } from "@/types/database";

export function TransactionEditSheet({
  transaction,
  onClose,
}: {
  transaction: TransactionWithCategory | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!transaction} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
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
    setBusy(false);
    if (error) {
      toast.error("Couldn't update", { description: error.message });
      return;
    }
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
