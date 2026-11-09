import { codeSlug, formatYears, parseGeneration } from "@/app/lib/chassis";

/**
 * A chassis-code pill. Clicking it filters ONE model's page to that platform
 * (e.g. A7 Sportback → only its C8s, both the 2nd Gen and the Facelift) —
 * never across different models.
 */
export function CodeChip({ brandSlug, modelSlug, raw, code, active = false, href, className = "" }: {
  brandSlug: string; modelSlug: string; raw: string; code: string; active?: boolean; href?: string; className?: string;
}) {
  return (
    <a
      href={href ?? `/catalog/${brandSlug}/${modelSlug}?platform=${codeSlug(code)}`}
      title={active ? `Clear the ${code} filter` : `Show only ${code}`}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none transition-colors ${
        active
          ? "border-indigo-400 bg-indigo-600 text-white hover:bg-indigo-500"
          : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-500/25 hover:text-white"
      } ${className}`}
    >
      {raw}{active && <span aria-hidden="true">×</span>}
    </a>
  );
}

/** Just the code pills of a generation name. */
export function GenerationCodes({ name, brandSlug, modelSlug }: { name: string; brandSlug: string; modelSlug: string }) {
  const { codes } = parseGeneration(name);
  if (!codes.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {codes.map((c) => <CodeChip key={c.raw} brandSlug={brandSlug} modelSlug={modelSlug} raw={c.raw} code={c.code} />)}
    </span>
  );
}

/**
 * "2nd Gen  [4K8] [C8]  2018–2023" — the label (optionally a link), clickable
 * chassis codes that filter this model, and the years.
 * Don't render it inside another link.
 */
export default function GenerationLabel({ name, brandSlug, modelSlug, labelHref, className = "" }: {
  name: string; brandSlug: string; modelSlug: string; labelHref?: string; className?: string;
}) {
  const g = parseGeneration(name);
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {labelHref
        ? <a href={labelHref} className="underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-300">{g.label}</a>
        : <span>{g.label}</span>}
      {g.codes.map((c) => <CodeChip key={c.raw} brandSlug={brandSlug} modelSlug={modelSlug} raw={c.raw} code={c.code} />)}
      {g.years && <span className="tabular-nums text-zinc-500">{formatYears(g.years)}</span>}
    </span>
  );
}
