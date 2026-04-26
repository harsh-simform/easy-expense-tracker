import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-80" />
      </div>

      <section className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="rounded-lg border bg-card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0"
            >
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
