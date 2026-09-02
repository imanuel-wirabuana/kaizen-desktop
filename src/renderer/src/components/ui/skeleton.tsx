import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-xl border border-border/40 shadow-2xs", className)}
      {...props}
    />
  )
}

export { Skeleton }

