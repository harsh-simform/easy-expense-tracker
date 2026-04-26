import { Skeleton } from "@/components/ui/skeleton";
import { TransactionRowsSkeleton } from "@/app/(app)/dashboard/loading";

export default function TransactionsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>

      <TransactionRowsSkeleton count={8} />
    </div>
  );
}
