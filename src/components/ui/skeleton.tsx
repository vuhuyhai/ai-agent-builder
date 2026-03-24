import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-overlay', className)}
      aria-hidden="true"
    />
  )
}

/** Simulates a chat conversation loading state */
export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6" aria-label="Đang tải..." aria-busy="true">
      {/* Assistant bubble */}
      <div className="flex gap-3 items-start">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 max-w-xs">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      {/* User bubble */}
      <div className="flex gap-3 items-start justify-end">
        <div className="space-y-2 flex-1 max-w-[160px]">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 ml-auto" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
      {/* Assistant bubble */}
      <div className="flex gap-3 items-start">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 max-w-sm">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  )
}
