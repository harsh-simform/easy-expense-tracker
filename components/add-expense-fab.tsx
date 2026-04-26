"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { parseInput } from "@/lib/parse-input";
import { rankCategoriesByMatch } from "@/lib/categorize";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/lib/use-media-query";
import { useCategories } from "@/components/categories-provider";
import { SplitInput, type SplitDraft } from "@/components/split-input";

export function AddExpenseFab() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="icon"
            className="fixed bottom-20 right-4 z-30 size-14 rounded-full shadow-lg md:bottom-6 md:right-6"
            aria-label="Add expense"
          />
        }
      >
        <Plus className="size-6" />
      </SheetTrigger>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full overflow-y-auto sm:max-w-md"
            : "max-h-[90dvh] overflow-y-auto"
        }
        showCloseButton={false}
      >
        <SheetHeader className="text-left">
          <SheetTitle>Add expense</SheetTitle>
          <SheetDescription>
            Type something like <span className="font-mono">100 petrol</span>.
          </SheetDescription>
        </SheetHeader>
        <AddExpenseForm onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function AddExpenseForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const categories = useCategories();
  const [raw, setRaw] = useState("");
  // Track the raw value at the moment of pick so the override auto-clears when input changes.
  const [manualPick, setManualPick] = useState<{ raw: string; id: string } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [splits, setSplits] = useState<SplitDraft[]>([]);

  const parsed = useMemo(() => parseInput(raw), [raw]);

  const { suggested, rest } = useMemo(
    () => rankCategoriesByMatch(parsed?.description ?? "", categories),
    [parsed, categories],
  );
  const autoCategoryId = suggested[0]?.id ?? null;

  const manualCategoryId = manualPick?.raw === raw ? manualPick.id : null;
  const effectiveCategoryId = manualCategoryId ?? autoCategoryId;
  const effectiveCategory = categories.find((c) => c.id === effectiveCategoryId) ?? null;

  const canSubmit = !!parsed && !!effectiveCategoryId && !submitting;

  const splitsTotal = splits.reduce((acc, s) => acc + s.amount, 0);
  const splitsOverflow = !!parsed && splitsTotal > parsed.amount + 0.01;

  const handleSubmit = async () => {
    if (!canSubmit || !parsed || !effectiveCategoryId) return;
    if (splitsOverflow) {
      toast.error("Splits exceed the total");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data: tx, error } = await supabase
      .from("transactions")
      .insert({
        amount: parsed.amount,
        description: parsed.description || null,
        category_id: effectiveCategoryId,
        occurred_on: format(date, "yyyy-MM-dd"),
      })
      .select("id")
      .single();
    if (error || !tx) {
      setSubmitting(false);
      toast.error("Couldn't save", { description: error?.message });
      return;
    }

    if (splits.length > 0) {
      // Resolve any chips that don't have a person row yet (new names) by
      // upserting into people, then build the splits payload.
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
          setSubmitting(false);
          toast.error("Couldn't save people", { description: peopleErr.message });
          return;
        }
        nameToId = new Map((created ?? []).map((p) => [p.name, p.id]));
      }
      const payload = splits
        .filter((s) => s.amount > 0)
        .map((s) => ({
          transaction_id: tx.id,
          person_id: s.personId ?? nameToId.get(s.name)!,
          amount: s.amount,
          paid_at: s.paidAt,
        }));
      if (payload.length > 0) {
        const { error: splitErr } = await supabase
          .from("transaction_splits")
          .insert(payload);
        if (splitErr) {
          setSubmitting(false);
          toast.error("Saved expense, but splits failed", {
            description: splitErr.message,
          });
          onDone();
          router.refresh();
          return;
        }
      }
    }

    setSubmitting(false);
    toast.success(`Saved ${formatINR(parsed.amount)} · ${effectiveCategory?.name}`);
    setRaw("");
    setManualPick(null);
    setDate(new Date());
    setShowDate(false);
    setSplits([]);
    onDone();
    router.refresh();
  };

  return (
    <div className="space-y-4 px-4 pb-2">
      <Input
        autoFocus
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="100 petrol"
        className="h-12 text-base"
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) handleSubmit();
        }}
      />

      {parsed ? (
        <div className="rounded-lg border bg-card px-3 py-2.5">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold tabular-nums">
              {formatINR(parsed.amount)}
            </div>
            {parsed.description && (
              <div className="truncate text-sm text-muted-foreground">
                “{parsed.description}”
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enter an amount to get started.
        </p>
      )}

      {parsed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Category</Label>
            {suggested.length > 0 && manualCategoryId === null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3" />
                Auto-suggested
              </span>
            )}
          </div>
          <div className="relative">
            {effectiveCategory && (
              <span
                className="pointer-events-none absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: effectiveCategory.color ?? "#888" }}
              />
            )}
            <select
              value={effectiveCategoryId ?? ""}
              onChange={(e) => e.target.value && setManualPick({ raw, id: e.target.value })}
              className={cn(
                "h-10 w-full appearance-none rounded-lg border border-input bg-transparent pr-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                effectiveCategory ? "pl-7" : "pl-2.5",
              )}
            >
              {!effectiveCategoryId && (
                <option value="" disabled>
                  Select a category
                </option>
              )}
              {suggested.length > 0 && (
                <optgroup label="Suggested">
                  {suggested.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {rest.length > 0 && (
                <optgroup label={suggested.length > 0 ? "All categories" : "Categories"}>
                  {rest.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {parsed && (
        <div className="space-y-2">
          {!showDate ? (
            <button
              type="button"
              onClick={() => setShowDate(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="size-3" />
              For today · change date
            </button>
          ) : (
            <>
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
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
            </>
          )}
        </div>
      )}

      {parsed && (
        <SplitInput
          total={parsed.amount}
          value={splits}
          onChange={setSplits}
        />
      )}

      <SheetFooter className="flex-row gap-2 px-0">
        <SheetClose render={<Button variant="ghost" className="flex-1" />}>
          Cancel
        </SheetClose>
        <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
          {submitting ? "Saving…" : "Save"}
        </Button>
      </SheetFooter>
    </div>
  );
}
