"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePeople } from "@/components/people-provider";

export type SplitDraft = {
  // For existing rows on edit: the persisted split id (used so Save can diff
  // updates from inserts). Undefined for chips added in this session.
  id?: string;
  // Existing person row from `people`. If null, name is a brand-new entry that
  // should be inserted on save.
  personId: string | null;
  name: string;
  amount: number;
  paidAt: string | null;
};

export function SplitInput({
  total,
  value,
  onChange,
  onTogglePaid,
}: {
  total: number;
  value: SplitDraft[];
  onChange: (next: SplitDraft[]) => void;
  // Provided in edit mode so the Mark Paid toggle can run a write directly.
  // In add mode (no persisted splits yet), it's omitted and chips are paid-on-create.
  onTogglePaid?: (split: SplitDraft, paid: boolean) => Promise<void>;
}) {
  const people = usePeople();
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const yourShare = Math.max(0, total - value.reduce((acc, s) => acc + s.amount, 0));
  const overflow = total > 0 && value.reduce((acc, s) => acc + s.amount, 0) > total;

  const taken = new Set(value.map((s) => s.name.toLowerCase()));
  const suggestions = useMemo(
    () =>
      people
        .filter(
          (p) =>
            !taken.has(p.name.toLowerCase()) &&
            (!query || p.name.toLowerCase().includes(query.toLowerCase())),
        )
        .slice(0, 6),
    [people, query, taken],
  );

  const equalShare = (count: number) =>
    count > 0 && total > 0 ? Math.round((total / (count + 1)) * 100) / 100 : 0;

  const addPerson = (name: string, personId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    const nextCount = value.length + 1;
    const each = equalShare(nextCount);
    // Re-balance existing chips to the new equal share, but only if the user
    // hasn't manually edited an amount yet (we infer that by checking if all
    // existing chips were already at the previous equal share).
    const prevEach = equalShare(value.length);
    const allDefault = value.every((s) => Math.abs(s.amount - prevEach) < 0.01);
    const next: SplitDraft[] = allDefault
      ? value.map((s) => ({ ...s, amount: each }))
      : value;
    onChange([
      ...next,
      { personId, name: trimmed, amount: each, paidAt: null },
    ]);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    const prevEach = equalShare(value.length);
    const wasAllDefault = value.every((s) => Math.abs(s.amount - prevEach) < 0.01);
    if (wasAllDefault && next.length > 0) {
      const each = equalShare(next.length);
      onChange(next.map((s) => ({ ...s, amount: each })));
    } else {
      onChange(next);
    }
  };

  const updateAmount = (idx: number, amount: number) => {
    onChange(value.map((s, i) => (i === idx ? { ...s, amount } : s)));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = people.find(
        (p) => p.name.toLowerCase() === query.trim().toLowerCase(),
      );
      addPerson(query, exact?.id ?? null);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3" />
          Split with
        </span>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Your share: <span className="font-medium tabular-nums text-foreground">
              {formatINR(yourShare)}
            </span>
          </span>
        )}
      </div>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((s, idx) => (
            <li
              key={s.id ?? `${s.name}-${idx}`}
              className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5"
            >
              <span className="flex-1 truncate text-sm">{s.name}</span>
              <Input
                type="number"
                inputMode="decimal"
                value={s.amount === 0 ? "" : String(s.amount)}
                onChange={(e) => updateAmount(idx, Number(e.target.value) || 0)}
                className="h-7 w-24 text-right tabular-nums"
              />
              {onTogglePaid && s.id && (
                <Button
                  type="button"
                  variant={s.paidAt ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onTogglePaid(s, !s.paidAt)}
                  title={s.paidAt ? "Paid — click to mark unpaid" : "Mark paid"}
                >
                  <Check className={cn("size-3", !s.paidAt && "opacity-50")} />
                  {s.paidAt ? "Paid" : "Mark paid"}
                </Button>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Remove ${s.name}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={
              value.length === 0 ? "Add a person (Enter to confirm)" : "Add another"
            }
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              const exact = people.find(
                (p) => p.name.toLowerCase() === query.trim().toLowerCase(),
              );
              addPerson(query, exact?.id ?? null);
            }}
            disabled={!query.trim()}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>

        {showSuggest && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border bg-popover py-1 shadow-md">
            {suggestions.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addPerson(p.name, p.id);
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {overflow && (
        <p className="text-xs text-destructive">
          Splits exceed the total. Reduce a share or remove a person.
        </p>
      )}
    </div>
  );
}
