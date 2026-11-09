import { Bone } from "@/app/components/Bone";

export default function SpotLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-6 border-b border-zinc-800/60 pb-4">
        <Bone className="h-10 w-56" />
        <Bone className="hidden h-4 w-64 sm:block" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="border-b border-zinc-800 px-5 py-3"><Bone className="h-5 w-32" /></div>
            <div className="p-3 sm:p-5">
              <Bone className="aspect-[4/3] w-full rounded-xl sm:aspect-[16/10]" />
              <div className="mt-6 flex flex-col items-center gap-3">
                <Bone className="h-8 w-48" />
                <Bone className="h-4 w-60" />
                <Bone className="mt-3 h-[86px] w-[389px] max-w-full" />
              </div>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3"><Bone className="h-9 w-9 rounded-xl" /><div className="space-y-1.5"><Bone className="h-4 w-24" /><Bone className="h-3 w-16" /></div></div>
            <Bone className="mt-4 h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            {Array.from({ length: 5 }, (_, i) => <Bone key={i} className="h-4 w-full" />)}
          </div>
        </aside>
      </div>
    </main>
  );
}
