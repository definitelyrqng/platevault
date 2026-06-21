import { SkeletonGrid } from "@/app/components/SkeletonCard";

export default function CountryLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-8 h-16 w-48 rounded-2xl bg-zinc-900 animate-pulse" />
      <SkeletonGrid count={12} />
    </main>
  );
}
