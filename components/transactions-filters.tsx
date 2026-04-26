"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Calendar as CalendarIcon, Download, Filter, X } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/components/categories-provider";

type Props = {
  from: string;
  to: string;
  categoryIds: string[];
};

export function TransactionsFilters({ from, to, categoryIds }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const categories = useCategories();
  const [fromDate, setFromDate] = useState<Date>(parseISO(from));
  const [toDate, setToDate] = useState<Date>(parseISO(to));

  const selectedCats = useMemo(
    () => categories.filter((c) => categoryIds.includes(c.id)),
    [categories, categoryIds],
  );

  const updateParam = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    startTransition(() => {
      router.push(`/transactions?${p.toString()}`);
    });
  };

  const setRange = (f: Date, t: Date) => {
    updateParam((p) => {
      p.set("from", format(f, "yyyy-MM-dd"));
      p.set("to", format(t, "yyyy-MM-dd"));
    });
  };

  const toggleCategory = (id: string) => {
    const set = new Set(categoryIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    updateParam((p) => {
      p.delete("categoryId");
      for (const c of set) p.append("categoryId", c);
    });
  };

  const clearCategories = () =>
    updateParam((p) => {
      p.delete("categoryId");
    });

  const exportHref = `/api/transactions/export?${searchParams.toString()}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline" size="sm" className="font-normal" />}
        >
          <CalendarIcon className="size-4" />
          {format(fromDate, "d MMM")} – {format(toDate, "d MMM yyyy")}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <div className="px-1 pb-1 text-xs text-muted-foreground">From</div>
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => {
                  if (!d) return;
                  setFromDate(d);
                  setRange(d, toDate);
                }}
                initialFocus
              />
            </div>
            <div>
              <div className="px-1 pb-1 text-xs text-muted-foreground">To</div>
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={(d) => {
                  if (!d) return;
                  setToDate(d);
                  setRange(fromDate, d);
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className="font-normal" />}
        >
          <Filter className="size-4" />
          Categories
          {selectedCats.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCats.length}
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {categories.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={categoryIds.includes(c.id)}
              onCheckedChange={() => toggleCategory(c.id)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: c.color ?? "#888" }}
                />
                {c.name}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          {selectedCats.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <button
                onClick={clearCategories}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
              >
                <X className="size-3.5" /> Clear
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        nativeButton={false}
        render={<a href={exportHref} />}
        variant="outline"
        size="sm"
        className="ml-auto font-normal"
      >
        <Download className="size-4" />
        Export CSV
      </Button>

      {isPending && (
        <span className="text-xs text-muted-foreground">Loading…</span>
      )}
    </div>
  );
}
