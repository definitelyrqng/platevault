import { Bone, SpotGridSkeleton } from "@/app/components/Bone";

export default function HomeLoading() {
  return (
    <div className="pb-16">
      <section className="border-b border-zinc-800/60">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_auto]">
          <div>
            <Bone className="h-3 w-40" />
            <Bone className="mt-4 h-12 w-80 max-w-full" />
            <Bone className="mt-4 h-4 w-full max-w-xl" />
            <Bone className="mt-6 h-12 w-full max-w-xl rounded-xl" />
          </div>
          <div className="hidden gap-10 lg:flex">
            {[0, 1, 2].map((i) => <Bone key={i} className="h-14 w-20" />)}
          </div>
        </div>
      </section>
      <div className="flex gap-1 overflow-hidden">
        {Array.from({ length: 10 }, (_, i) => <Bone key={i} className="aspect-[4/3] h-32 shrink-0 rounded-none sm:h-40" />)}
      </div>
      <div className="mx-auto max-w-6xl space-y-14 px-4 pt-10 sm:px-6">
        <div>
          <Bone className="mb-4 h-6 w-48" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <Bone key={i} className="aspect-[16/10] rounded-xl" />)}
          </div>
        </div>
        <div>
          <Bone className="mb-4 h-6 w-40" />
          <SpotGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
