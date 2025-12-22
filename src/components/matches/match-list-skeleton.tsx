
import { Skeleton } from "@/components/ui/skeleton"

export function MatchListSkeleton() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg shadow-sm">
              <div className="p-5">
                 <Skeleton className="h-6 w-3/4 mb-3" />
                <div className="flex justify-between items-center text-muted-foreground mb-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="p-3 bg-muted/50 border-t">
                 <Skeleton className="h-10 w-full" />
              </div>
            </div>
        ))}
      </div>
    </div>
  )
}
