
import { Skeleton } from "@/components/ui/skeleton"

export function AppShellSkeleton() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      {/* ---- Sidebar Skeleton (Desktop) ---- */}
      <div className="hidden border-r bg-card lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-6">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full mb-2" />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* ---- Header Skeleton (Mobile & Desktop) ---- */}
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:px-6 sticky top-0 z-40">
           <Skeleton className="h-8 w-8 lg:hidden" />
           <div className="w-full flex-1">
             {/* Search Skeleton or other header elements */}
          </div>
           <Skeleton className="h-8 w-8" />
           <Skeleton className="h-10 w-24" />
        </header>

        {/* ---- Main Content Skeleton ---- */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/40">
          {/* You can replace this with a more specific content skeleton */}
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
        </main>
      </div>
    </div>
  );
}
