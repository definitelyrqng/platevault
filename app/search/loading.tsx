import { SkeletonFeed } from "@/app/components/SkeletonCard";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-16">
      <div className="mb-8 h-12 w-full rounded-xl bg-zinc-900 animate-pulse" />
      <SkeletonFeed count={8} />
    </div>
  );
}
