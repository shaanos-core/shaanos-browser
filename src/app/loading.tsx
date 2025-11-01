import { Skeleton } from "@/components/ui/skeleton";
import { Box, Search } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Box className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">ShaanOS Packages Browser</h1>
        </div>
        <Skeleton className="h-10 w-40" />
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="grid w-full grid-cols-1 md:grid-cols-[350px_1fr]">
          <div className="flex flex-col border-r border-border">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-10 w-full rounded-lg pl-10" />
              </div>
            </div>
            <div className="flex-1 p-4 pt-0 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-5 w-5 mt-1 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-6 w-64 mt-4 mx-auto" />
              <Skeleton className="h-4 w-80 mt-2 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
