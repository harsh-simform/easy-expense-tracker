"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { createClient } from "@/lib/supabase/client";
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
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto sm:mx-auto sm:max-w-md"
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
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category">
                {(value) => {
                  const cat = categories.find((c) => c.id === value);
                  if (!cat) return "Select category";
                  return (
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: cat.color ?? "#888" }}
                      />
                      {cat.name}
                    </span>
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: c.color ?? "#888" }}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
