/** Pulsing placeholder block used by the loading.tsx skeletons. */
export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-zinc-800/60 ${className}`} />;
}

/** Placeholder matching <SpotCard>: photo, centred plate, vehicle, spotter. */
export function SpotCardSkeleton() {
  return (
    <div>
      <Bone className="aspect-[4/3] rounded-xl" />
      <div className="mt-3 flex justify-center"><Bone className="h-7 w-28" /></div>
      <Bone className="mx-auto mt-2.5 h-4 w-32" />
      <Bone className="mx-auto mt-1.5 h-3 w-24" />
    </div>
  );
}

export function SpotGridSkeleton({ count = 12, className = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-x-4 gap-y-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => <SpotCardSkeleton key={i} />)}
    </div>
  );
}
