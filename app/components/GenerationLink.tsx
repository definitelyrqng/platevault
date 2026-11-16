/**
 * A generation shown exactly as named — "2nd Gen (4K8/C8) (2018-2023)" — as ONE link
 * (like PlatesMania). It opens the results for exactly that generation (?gen=) —
 * not for every generation sharing its chassis code. Don't render it inside another link.
 */
export default function GenerationLink({ name, brandSlug, modelSlug, className = "" }: {
  name: string; brandSlug: string; modelSlug: string; className?: string;
}) {
  const href = `/catalog/${brandSlug}/${modelSlug}?gen=${encodeURIComponent(name)}`;
  return (
    <a
      href={href}
      title={`Show only ${name}`}
      className={`underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-300 ${className}`}
    >
      {name}
    </a>
  );
}
