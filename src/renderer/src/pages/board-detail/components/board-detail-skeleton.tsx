import { Skeleton } from '@/components/ui/skeleton'

export function BoardDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b pb-2 px-0.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-lg shrink-0" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-14 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-md hidden sm:block" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 size-7 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>

      {/* Kanban Board Canvas Area Skeleton */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-muted/20 p-3">
        <div className="flex h-full gap-4 items-start overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((col) => (
            <div
              key={col}
              className="flex h-fit max-h-full w-72 shrink-0 flex-col rounded-lg border bg-card/90 p-3 space-y-3 shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex h-14 shrink-0 items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-6 rounded-full" />
                </div>
                <Skeleton className="size-5 rounded-md" />
              </div>
              {/* Cards List */}
              <div className="space-y-2.5 flex-1 min-h-[140px]">
                <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-14 rounded-full" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="size-5 rounded-full" />
                  </div>
                </div>
                <div className="rounded-xl border bg-background p-3 space-y-2.5 shadow-2xs">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-12 rounded-md" />
                    <Skeleton className="size-5 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Footer Button Skeleton */}
              <div className="pt-1 border-t">
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
