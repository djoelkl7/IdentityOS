import { cn } from "@/src/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Main Stats Skeletons */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-white/5" />
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-8 w-32 bg-white/5 rounded" />
        </div>
      ))}
    </div>

    {/* Big Section Skeleton */}
    <div className="bg-white/5 rounded-2xl p-8 h-48" />

    {/* BodyGraph/Mandala Skeleton Placeholder */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white/10 rounded-2xl p-8 h-[500px]" />
      <div className="bg-white/10 rounded-2xl p-8 h-[500px]" />
    </div>
  </div>
);

export const LabResultSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <div className="bg-white/5 rounded-2xl p-6 h-64 animate-pulse" />
  </div>
);
