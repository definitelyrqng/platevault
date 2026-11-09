import { Bone, SpotGridSkeleton } from "@/app/components/Bone";

export default function CountryLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <Bone className="mb-4 h-3 w-36" />
      <div className="flex items-center gap-4 border-b border-zinc-800/60 pb-6">
        <Bone className="h-8 w-12" />
        <div className="space-y-2">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        {[24, 32, 28, 24, 20].map((w, i) => <Bone key={i} className="h-8 rounded-full" />)}
      </div>
      <div className="mt-6"><SpotGridSkeleton count={12} /></div>
    </main>
  );
}
