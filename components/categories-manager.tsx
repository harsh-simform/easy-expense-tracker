"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/database";

const SWATCHES = [
  "#f97316", "#3b82f6", "#22c55e", "#ec4899", "#eab308",
  "#8b5cf6", "#ef4444", "#a855f7", "#06b6d4", "#64748b",
];

export function CategoriesManager({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <CategoryRow key={c.id} category={c} />
      ))}
      <NewCategoryRow />
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color ?? SWATCHES[0]);
  const [keywords, setKeywords] = useState<string[]>(category.keywords ?? []);
  const [newKeyword, setNewKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const supabase = createClient();

  const save = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim(), color, keywords })
      .eq("id", category.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    toast.success("Saved");
    setDirty(false);
    router.refresh();
  };

  const archive = async () => {
    if (!confirm(`Archive "${category.name}"? Existing transactions will keep this category, but it won't appear in pickers.`)) {
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("categories")
      .update({ archived: true })
      .eq("id", category.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't archive", { description: error.message });
      return;
    }
    toast.success("Archived");
    router.refresh();
  };

  const addKeyword = () => {
    const k = newKeyword.trim().toLowerCase();
    if (!k || keywords.includes(k)) {
      setNewKeyword("");
      return;
    }
    setKeywords([...keywords, k]);
    setNewKeyword("");
    setDirty(true);
  };

  const removeKeyword = (k: string) => {
    setKeywords(keywords.filter((x) => x !== k));
    setDirty(true);
  };

  return (
    <Card>
      <CardContent className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="h-9 max-w-xs"
          />
          <div className="flex items-center gap-1">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setDirty(true);
                }}
                className="size-5 rounded-full ring-offset-2 ring-offset-background transition-shadow"
                style={{
                  backgroundColor: c,
                  outline: color === c ? "2px solid var(--ring)" : "none",
                }}
                aria-label={`Pick color ${c}`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={archive}
            disabled={busy}
            aria-label="Archive category"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">Keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <Badge key={k} variant="secondary" className="gap-1 pr-1">
                {k}
                <button
                  onClick={() => removeKeyword(k)}
                  className="rounded-full p-0.5 hover:bg-background"
                  aria-label={`Remove ${k}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="add keyword"
                className="h-7 w-32 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {dirty && (
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewCategoryRow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      color,
      icon: "circle",
      keywords: [],
      sort_order: 500,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't create", { description: error.message });
      return;
    }
    toast.success("Category added");
    setName("");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" />
        Add category
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 px-4 py-3">
        <Input
          autoFocus
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <div className="flex items-center gap-1">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-5 rounded-full"
              style={{
                backgroundColor: c,
                outline: color === c ? "2px solid var(--ring)" : "none",
              }}
              aria-label={`Pick color ${c}`}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={create} disabled={busy || !name.trim()}>
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
