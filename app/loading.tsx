import { Bone, SpotGridSkeleton } from "@/app/components/Bone";

/** Fallback for every page that has no loading screen of its own. */
export default function RootLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <Bone className="h-8 w-56" />
      <Bone className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8"><SpotGridSkeleton count={8} /></div>
    </main>
  );
}
