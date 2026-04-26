import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OwedLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-3 w-24" />
          <Skeleton className="ml-auto h-6 w-28" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, gi) => (
          <Card key={gi}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-1 items-center gap-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
              <ul className="border-t">
                {Array.from({ length: 2 }).map((_, ri) => (
                  <li
                    key={ri}
                    className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                  >
                    <Skeleton className="size-2 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
