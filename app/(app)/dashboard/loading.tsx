import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 py-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-56 w-full rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-12" />
        </div>
        <TransactionRowsSkeleton count={6} />
      </div>
    </div>
  );
}

export function TransactionRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
        >
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
