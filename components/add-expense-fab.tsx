"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Calendar as CalendarIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { parseInput } from "@/lib/parse-input";
import { rankCategoriesByMatch } from "@/lib/categorize";
import { formatINR } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/components/categories-provider";

export function AddExpenseFab() {
  const [open, setOpen] = useState(false);
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
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
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

  const handleSubmit = async () => {
    if (!canSubmit || !parsed || !effectiveCategoryId) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").insert({
      amount: parsed.amount,
      description: parsed.description || null,
      category_id: effectiveCategoryId,
      occurred_on: format(date, "yyyy-MM-dd"),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success(`Saved ${formatINR(parsed.amount)} · ${effectiveCategory?.name}`);
    setRaw("");
    setManualPick(null);
    setDate(new Date());
    setShowDate(false);
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
          <Select
            value={effectiveCategoryId ?? ""}
            onValueChange={(v) => v && setManualPick({ raw, id: v })}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Select a category">
                {(value) => {
                  const cat = categories.find((c) => c.id === value);
                  if (!cat) return "Select a category";
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
              {suggested.length > 0 && (
                <>
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Suggested
                    </SelectLabel>
                    {suggested.map((c) => (
                      <CategoryOption key={c.id} category={c} />
                    ))}
                  </SelectGroup>
                  {rest.length > 0 && <SelectSeparator />}
                </>
              )}
              {rest.length > 0 && (
                <SelectGroup>
                  <SelectLabel>
                    {suggested.length > 0 ? "All categories" : "Categories"}
                  </SelectLabel>
                  {rest.map((c) => (
                    <CategoryOption key={c.id} category={c} />
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
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

function CategoryOption({
  category,
}: {
  category: { id: string; name: string; color: string | null };
}) {
  return (
    <SelectItem value={category.id}>
      <span className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: category.color ?? "#888" }}
        />
        {category.name}
      </span>
    </SelectItem>
  );
}
