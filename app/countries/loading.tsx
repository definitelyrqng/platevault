import { Bone } from "@/app/components/Bone";

export default function CountriesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="flex items-end justify-between border-b border-zinc-800/60 pb-6">
        <div className="space-y-2"><Bone className="h-8 w-40" /><Bone className="h-4 w-56" /></div>
        <Bone className="hidden h-10 w-72 rounded-lg sm:block" />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => <Bone key={i} className="aspect-[16/10] rounded-xl" />)}
        </div>
        <Bone className="hidden h-96 rounded-xl lg:block" />
      </div>
    </main>
  );
}
