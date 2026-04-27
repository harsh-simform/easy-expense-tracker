"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  presetFor,
  presetsFor,
  type FlowPreset,
} from "@/lib/flow-presets";
import type {
  FlowDirection,
  FlowFrequency,
  RecurringFlow,
} from "@/types/database";

export function RecurringFlowsManager({
  direction,
  flows,
}: {
  direction: FlowDirection;
  flows: RecurringFlow[];
}) {
  const [picking, setPicking] = useState(false);
  const [activePreset, setActivePreset] = useState<FlowPreset | null>(null);

  const openPicker = () => {
    setActivePreset(null);
    setPicking(true);
  };

  const active = flows.filter((f) => f.active);
  const stopped = flows.filter((f) => !f.active);

  return (
    <div className="space-y-5">
      {flows.length === 0 ? (
        <EmptyState direction={direction} onAdd={openPicker} />
      ) : (
        <>
          {active.length > 0 && (
            <Section title="Recurring" badge={`${active.length}`}>
              <div className="space-y-2">
                {active.map((f) => (
                  <FlowRow key={f.id} flow={f} />
                ))}
              </div>
            </Section>
          )}
          {stopped.length > 0 && (
            <Section title="Stopped" badge={`${stopped.length}`} muted>
              <div className="space-y-2">
                {stopped.map((f) => (
                  <FlowRow key={f.id} flow={f} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <Button variant="outline" onClick={openPicker} className="w-full">
        <Plus className="size-4" />
        Add {direction === "income" ? "income" : "outcome"}
      </Button>

      <PresetPickerSheet
        direction={direction}
        open={picking}
        onOpenChange={setPicking}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
      />
    </div>
  );
}

function Section({
  title,
  badge,
  muted,
  children,
}: {
  title: string;
  badge?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            muted ? "text-muted-foreground" : "text-foreground/80",
          )}
        >
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  direction,
  onAdd,
}: {
  direction: FlowDirection;
  onAdd: () => void;
}) {
  const Icon = direction === "income" ? TrendingUp : TrendingDown;
  const tone =
    direction === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-orange-600 dark:text-orange-400";
  return (
    <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className={cn("size-5", tone)} />
      </div>
      <h3 className="text-sm font-semibold">
        No {direction === "income" ? "income" : "outcome"} added yet
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {direction === "income"
          ? "Start with your salary, then any side income."
          : "Add SIPs, EMIs, rent, premiums — anything that auto-debits."}
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}>
        <Plus className="size-4" />
        Add your first {direction === "income" ? "source" : "outflow"}
      </Button>
    </div>
  );
}

function FlowRow({ flow }: { flow: RecurringFlow }) {
  const router = useRouter();
  const supabase = createClient();
  const preset = presetFor(flow.kind);
  const Icon = preset.icon;

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(flow.label);
  const [amount, setAmount] = useState(String(flow.amount));
  const [frequency, setFrequency] = useState<FlowFrequency>(flow.frequency);
  const [busy, setBusy] = useState(false);

  const dirty =
    editing &&
    (label.trim() !== flow.label ||
      Number(amount) !== Number(flow.amount) ||
      frequency !== flow.frequency);

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
      .from("recurring_flows")
      .update({ label: label.trim(), amount: n, frequency })
      .eq("id", flow.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success("Saved");
    setEditing(false);
    router.refresh();
  };

  const cancel = () => {
    setLabel(flow.label);
    setAmount(String(flow.amount));
    setFrequency(flow.frequency);
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm(`Delete "${flow.label}"?`)) return;
    setBusy(true);
    const { error } = await supabase
      .from("recurring_flows")
      .delete()
      .eq("id", flow.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't delete", { description: error.message });
      return;
    }
    toast.success("Deleted");
    router.refresh();
  };

  const toggleActive = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("recurring_flows")
      .update({ active: !flow.active })
      .eq("id", flow.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't update", { description: error.message });
      return;
    }
    toast.success(flow.active ? "Stopped" : "Resumed");
    router.refresh();
  };

  const monthlyEq =
    flow.frequency === "yearly" ? Number(flow.amount) / 12 : Number(flow.amount);

  return (
    <Card className={cn(!flow.active && "opacity-60")}>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              preset.chip,
            )}
          >
            <Icon className={cn("size-4", preset.tone)} />
          </span>

          {editing ? (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8"
                placeholder="Label"
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-8 min-w-0 flex-1 tabular-nums"
                  placeholder="Amount"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") cancel();
                  }}
                />
                <FrequencyToggle value={frequency} onChange={setFrequency} compact />
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-medium">{flow.label}</div>
                {!flow.active && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    Stopped
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {preset.label} · {flow.frequency === "yearly" ? "Yearly" : "Monthly"}
              </div>
            </div>
          )}

          {editing ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={cancel}
                disabled={busy}
                aria-label="Cancel"
              >
                <X className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                onClick={save}
                disabled={busy || !dirty}
                aria-label="Save"
              >
                <Check className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">
                  {formatINR(Number(flow.amount))}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  /{flow.frequency === "yearly" ? "yr" : "mo"}
                  {flow.frequency === "yearly" && (
                    <> · {formatINR(monthlyEq)}/mo</>
                  )}
                </div>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {!editing && (
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-foreground/5 pt-2">
            <button
              type="button"
              onClick={toggleActive}
              disabled={busy}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {flow.active ? (
                <>
                  <PauseCircle className="size-3" /> Stop recurring
                </>
              ) : (
                <>
                  <PlayCircle className="size-3" /> Resume
                </>
              )}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FrequencyToggle({
  value,
  onChange,
  compact,
}: {
  value: FlowFrequency;
  onChange: (v: FlowFrequency) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 rounded-md border border-input bg-background p-0.5",
        compact ? "text-[11px]" : "text-xs",
      )}
    >
      {(["monthly", "yearly"] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={cn(
            "rounded-[4px] px-2 py-1 font-medium transition-colors",
            value === f
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {f === "monthly" ? "Monthly" : "Yearly"}
        </button>
      ))}
    </div>
  );
}

function PresetPickerSheet({
  direction,
  open,
  onOpenChange,
  activePreset,
  setActivePreset,
}: {
  direction: FlowDirection;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activePreset: FlowPreset | null;
  setActivePreset: (p: FlowPreset | null) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full overflow-y-auto sm:max-w-md"
            : "max-h-[90dvh] overflow-y-auto"
        }
        showCloseButton
      >
        <SheetHeader className="text-left">
          <SheetTitle>
            {activePreset
              ? `Add ${activePreset.label.toLowerCase()}`
              : `Pick ${direction === "income" ? "an income source" : "a recurring outflow"}`}
          </SheetTitle>
          <SheetDescription>
            {activePreset
              ? "Pick how often this happens, then enter the amount."
              : direction === "income"
                ? "Common income types for IT/corporate employees."
                : "SIPs, EMIs, premiums, rent — anything that auto-debits."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {activePreset ? (
            <CreateForm
              preset={activePreset}
              onBack={() => setActivePreset(null)}
              onDone={() => onOpenChange(false)}
            />
          ) : (
            <PresetGrid direction={direction} onPick={setActivePreset} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PresetGrid({
  direction,
  onPick,
}: {
  direction: FlowDirection;
  onPick: (p: FlowPreset) => void;
}) {
  const presets = presetsFor(direction);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {presets.map((p) => {
        const Icon = p.icon;
        return (
          <button
            key={p.kind}
            type="button"
            onClick={() => onPick(p)}
            className="flex flex-col items-start gap-1.5 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span
              className={cn("flex size-8 items-center justify-center rounded-md", p.chip)}
            >
              <Icon className={cn("size-4", p.tone)} />
            </span>
            <div>
              <div className="text-sm font-medium leading-tight">{p.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{p.hint}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CreateForm({
  preset,
  onBack,
  onDone,
}: {
  preset: FlowPreset;
  onBack: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const Icon = preset.icon;
  const [label, setLabel] = useState(preset.defaultLabel);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FlowFrequency>("monthly");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("recurring_flows").insert({
      direction: preset.direction,
      kind: preset.kind,
      label: label.trim(),
      amount: n,
      frequency,
      active: true,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't create", { description: error.message });
      return;
    }
    toast.success(`${preset.label} added`);
    router.refresh();
    onDone();
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-3 rounded-lg p-3", preset.chip)}>
        <span className="flex size-9 items-center justify-center rounded-md bg-background/60">
          <Icon className={cn("size-4", preset.tone)} />
        </span>
        <div>
          <div className="text-sm font-semibold">{preset.label}</div>
          <div className="text-xs opacity-80">{preset.hint}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Label</label>
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="A name you'll recognise"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Frequency</label>
        <FrequencyToggle value={frequency} onChange={setFrequency} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Amount per {frequency === "yearly" ? "year" : "month"} (₹)
        </label>
        <Input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="h-9 tabular-nums"
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          Yearly amounts are auto-converted to a monthly equivalent for the
          dashboard alert.
        </p>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button onClick={create} disabled={busy || !label.trim() || !amount}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </div>
    </div>
  );
}
