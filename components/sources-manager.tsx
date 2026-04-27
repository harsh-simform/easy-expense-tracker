"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Briefcase,
  PiggyBank,
  TrendingUp,
  Coins,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { IncomeSource, IncomeSourceKind } from "@/types/database";

const KINDS: { value: IncomeSourceKind; label: string; hint: string }[] = [
  { value: "salary", label: "Salary", hint: "Take-home income" },
  { value: "sip", label: "SIP", hint: "Mutual fund / recurring" },
  { value: "investment", label: "Investment", hint: "Other fixed monthly" },
  { value: "other", label: "Other", hint: "Side income, rent, etc." },
];

const KIND_META: Record<
  IncomeSourceKind,
  { icon: typeof Briefcase; tone: string; chip: string }
> = {
  salary: {
    icon: Briefcase,
    tone: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  sip: {
    icon: PiggyBank,
    tone: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  investment: {
    icon: TrendingUp,
    tone: "text-blue-600 dark:text-blue-400",
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  other: {
    icon: Coins,
    tone: "text-slate-600 dark:text-slate-400",
    chip: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  },
};

const KIND_LABEL: Record<IncomeSourceKind, string> = {
  salary: "Salary",
  sip: "SIP",
  investment: "Investment",
  other: "Other",
};

export function SourcesManager({ sources }: { sources: IncomeSource[] }) {
  const grouped = KINDS.map(({ value, label }) => ({
    kind: value,
    label,
    items: sources.filter((s) => s.kind === value),
  }));

  return (
    <div className="space-y-6">
      {grouped.map((group) =>
        group.items.length > 0 ? (
          <section key={group.kind} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {group.label}
            </h2>
            <div className="space-y-2">
              {group.items.map((s) => (
                <SourceRow key={s.id} source={s} />
              ))}
            </div>
          </section>
        ) : null,
      )}
      <NewSourceRow />
    </div>
  );
}

function SourceRow({ source }: { source: IncomeSource }) {
  const router = useRouter();
  const [label, setLabel] = useState(source.label);
  const [amount, setAmount] = useState(String(source.amount));
  const [kind, setKind] = useState<IncomeSourceKind>(source.kind);
  const [active, setActive] = useState(source.active);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const supabase = createClient();
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const save = async () => {
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Amount must be a non-negative number");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("income_sources")
      .update({ label: label.trim(), amount: n, kind, active })
      .eq("id", source.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success("Saved");
    setDirty(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(`Delete "${source.label}"?`)) return;
    setBusy(true);
    const { error } = await supabase
      .from("income_sources")
      .delete()
      .eq("id", source.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't delete", { description: error.message });
      return;
    }
    toast.success("Deleted");
    router.refresh();
  };

  const toggleActive = async () => {
    const next = !active;
    setActive(next);
    setDirty(true);
  };

  return (
    <Card>
      <CardContent className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              meta.chip,
            )}
          >
            <Icon className={cn("size-4", meta.tone)} />
          </span>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setDirty(true);
            }}
            className="h-9 min-w-0 flex-1"
            aria-label="Source label"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={remove}
            disabled={busy}
            aria-label="Delete source"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount (₹)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setDirty(true);
              }}
              className="h-9 tabular-nums"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <KindSelect
              value={kind}
              onChange={(v) => {
                setKind(v);
                setDirty(true);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={toggleActive}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
              active
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {active ? "Active" : "Paused"}
          </button>
          {dirty && (
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          )}
          {!dirty && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatINR(Number(amount) || 0)}/mo
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewSourceRow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<IncomeSourceKind>("salary");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a non-negative amount");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("income_sources").insert({
      kind,
      label: label.trim(),
      amount: n,
      active: true,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't create", { description: error.message });
      return;
    }
    toast.success(`${KIND_LABEL[kind]} added`);
    setLabel("");
    setAmount("");
    setKind("salary");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" />
        Add source
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 px-4 py-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Type</label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {KINDS.map((k) => {
              const meta = KIND_META[k.value];
              const Icon = meta.icon;
              const selected = kind === k.value;
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted",
                  )}
                  aria-pressed={selected}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("size-3.5", meta.tone)} />
                    <span className="text-sm font-medium">{k.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{k.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Label</label>
          <Input
            autoFocus
            placeholder={
              kind === "salary"
                ? "e.g. Simform salary"
                : kind === "sip"
                  ? "e.g. Parag Parikh Flexi Cap"
                  : kind === "investment"
                    ? "e.g. PPF contribution"
                    : "e.g. Freelance"
            }
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Amount (₹/month)</label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 tabular-nums"
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={create} disabled={busy || !label.trim() || !amount}>
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function KindSelect({
  value,
  onChange,
}: {
  value: IncomeSourceKind;
  onChange: (v: IncomeSourceKind) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IncomeSourceKind)}
        className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
