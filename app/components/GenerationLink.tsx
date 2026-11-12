import { codeSlug, platformOf } from "@/app/lib/chassis";

/**
 * A generation shown exactly as named — "2nd Gen (4K8/C8) (2018-2023)" — as ONE link
 * (like PlatesMania). It opens that model's results for the generation's platform,
 * i.e. every A7 Sportback C8 (facelift included). Names without a code open
 * results for exactly that generation (?gen=). Don't render it inside another link.
 */
export default function GenerationLink({ name, brandSlug, modelSlug, className = "" }: {
  name: string; brandSlug: string; modelSlug: string; className?: string;
}) {
  const platform = platformOf(name);
  const href = platform
    ? `/catalog/${brandSlug}/${modelSlug}?platform=${codeSlug(platform)}`
    : `/catalog/${brandSlug}/${modelSlug}?gen=${encodeURIComponent(name)}`;
  return (
    <a
      href={href}
      title={platform ? `Show every ${platform}` : `Show only ${name}`}
      className={`underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-300 ${className}`}
    >
      {name}
    </a>
  );
}
