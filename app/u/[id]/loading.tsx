import { Bone } from "@/app/components/Bone";

export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40">
        <Bone className="h-40 w-full rounded-none sm:h-48" />
        <div className="px-6 pb-8 sm:px-8">
          <div className="flex items-end gap-5">
            <Bone className="-mt-14 h-28 w-28 rounded-3xl" />
            <div className="space-y-2 pb-1"><Bone className="h-9 w-48" /><Bone className="h-4 w-36" /></div>
          </div>
          <Bone className="mt-5 h-4 w-full max-w-md" />
        </div>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-28 rounded-2xl" />)}
      </div>
    </main>
  );
}
