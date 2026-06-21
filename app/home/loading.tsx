import { SkeletonFeed } from "@/app/components/SkeletonCard";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-16">
      <SkeletonFeed count={12} />
    </div>
  );
}
