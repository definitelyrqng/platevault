import { prisma } from "@/app/lib/prisma";
import { getCountryMeta } from "@/app/lib/countries";
import PlateBadge from "@/app/components/PlateBadge";
import { REPORT_CATEGORIES, reportCategory } from "@/app/lib/reports";
import ReportActions from "./ReportActions";

const PER = 20;

const ago = (d: Date) => {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : d.toLocaleDateString("en-GB");
};

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active ? "border-indigo-500 bg-indigo-600 text-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
  }`;

/** Admin → Reports: problems reported on spots (PlatesMania-style error list). */
export default async function ReportsTab({ rs, rc, rp, openCount }: { rs?: string; rc?: string; rp?: string; openCount: number }) {
  const status = rs === "done" || rs === "all" ? rs : "open";
  const cat = REPORT_CATEGORIES.find((c) => c.value === rc)?.value ?? null;
  const page = Math.max(1, Number(rp) || 1);

  const statusWhere = status === "all" ? {} : { status: status === "done" ? "DONE" : "OPEN" };
  const where = { ...statusWhere, ...(cat ? { category: cat } : {}) };

  const [total, byCat, doneCount, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.groupBy({ by: ["category"], where: statusWhere, _count: { id: true } }),
    prisma.report.count({ where: { status: "DONE" } }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: {
        id: true, category: true, details: true, status: true, createdAt: true,
        reporter: { select: { username: true } },
        upload: { select: { numericId: true, plateText: true, plateType: true, country: true, imageUrl: true, brand: true, model: true } },
      },
    }),
  ]);

  const countOf = new Map(byCat.map((r) => [r.category, r._count.id]));
  const pages = Math.max(1, Math.ceil(total / PER));
  const href = (o: { rs?: string; rc?: string | null; rp?: number }) => {
    const qs = new URLSearchParams({ tab: "reports" });
    const s = o.rs ?? status;
    if (s !== "open") qs.set("rs", s);
    const c = o.rc === undefined ? cat : o.rc;
    if (c) qs.set("rc", c);
    if (o.rp && o.rp > 1) qs.set("rp", String(o.rp));
    return "?" + qs.toString();
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">Problems reported on spots. New reports also ping the Discord moderation channel.</p>

      <div className="flex flex-wrap items-center gap-2">
        {([["open", `Open ${openCount}`], ["done", `Done ${doneCount}`], ["all", "All"]] as const).map(([k, label]) => (
          <a key={k} href={href({ rs: k, rp: 1 })} className={pill(status === k)}>{label}</a>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-800" />
        <a href={href({ rc: null, rp: 1 })} className={pill(!cat)}>Any reason</a>
        {REPORT_CATEGORIES.map((c) => (
          <a key={c.value} href={href({ rc: c.value, rp: 1 })} className={pill(cat === c.value)}>
            {c.icon} {c.short} <span className="ml-1 tabular-nums opacity-70">{countOf.get(c.value) ?? 0}</span>
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
          {status === "open" ? "No open reports. 🎉" : "Nothing here."}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const c = reportCategory(r.category);
            const car = [r.upload.brand, r.upload.model].filter(Boolean).join(" ");
            return (
              <li key={r.id} className={`overflow-hidden rounded-xl border bg-zinc-900/40 ${r.status === "DONE" ? "border-zinc-800/60 opacity-70" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 bg-zinc-900/60 px-4 py-2 text-xs">
                  <span className="font-semibold text-zinc-200">{c?.icon} {c?.label ?? r.category}</span>
                  <span className="flex items-center gap-2 text-zinc-500">
                    {r.status === "DONE" && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">Done</span>}
                    {ago(r.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <a href={`/spot/${r.upload.numericId}`} className="shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-800">
                    <img src={r.upload.imageUrl} alt="" className="h-20 w-28 object-cover" loading="lazy" />
                  </a>
                  <div className="min-w-[10rem] flex-1 space-y-1.5">
                    <PlateBadge country={r.upload.country} text={r.upload.plateText} plateType={r.upload.plateType} size="xs" />
                    <div className="text-xs text-zinc-500">{getCountryMeta(r.upload.country).name}{car && ` · ${car}`}</div>
                  </div>
                  <div className="min-w-[14rem] flex-[2] space-y-1">
                    <div className="text-xs text-zinc-500">@{r.reporter.username}</div>
                    <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">
                      {r.details || <span className="text-zinc-600">No message</span>}
                    </p>
                  </div>
                </div>
                <div className="border-t border-zinc-800/70 px-4 py-2.5">
                  <ReportActions id={r.id} status={r.status} spotNumericId={r.upload.numericId} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1 text-sm" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-zinc-600">…</span>}
                <a href={href({ rp: p })}
                  className={`min-w-9 rounded-md px-3 py-2 text-center tabular-nums ${
                    p === page ? "bg-indigo-600 font-semibold text-white" : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"}`}>{p}</a>
              </span>
            ))}
        </nav>
      )}
    </div>
  );
}
