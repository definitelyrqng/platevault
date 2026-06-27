import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";


const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function timeLeft(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(ms / 3_600_000);
  return `${hours}h left`;
}

async function getPolls() {
  const now = new Date();
  const polls = await prisma.poll.findMany({
    orderBy: [{ closesAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      numericId: true,
      country: true,
      type: true,
      year: true,
      month: true,
      closesAt: true,
      _count: { select: { nominees: true, votes: true } },
      nominees: {
        orderBy: { votes: { _count: "desc" } },
        take: 1,
        select: {
          upload: { select: { plateText: true, imageUrl: true } },
          _count: { select: { votes: true } },
        },
      },
    },
  });

  const open = polls.filter((p) => p.closesAt > now);
  const closed = polls.filter((p) => p.closesAt <= now);
  return { open, closed };
}

export default async function PollsPage() {
  const { open, closed } = await getPolls();

  function PollCard({ poll }: { poll: (typeof open)[0] }) {
    const meta = COUNTRY_META[poll.country] ?? {
      iso: null,
      name: poll.country.charAt(0).toUpperCase() + poll.country.slice(1),
    };
    const isOpen = new Date(poll.closesAt) > new Date();
    const title =
      poll.type === "YEARLY"
        ? `Plate of the Year ${poll.year}`
        : `Plate of the Month — ${MONTH_NAMES[poll.month]}`;
    const tl = timeLeft(new Date(poll.closesAt));
    const leader = poll.nominees[0];

    return (
      <a
        href={`/polls/${poll.numericId}`}
        className="group flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all"
      >
        {/* Leader thumbnail */}
        {leader && (
          <div className="aspect-video bg-zinc-950 overflow-hidden relative">
            <img
              src={leader.upload.imageUrl}
              alt={leader.upload.plateText}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {!isOpen && (
              <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-xs text-zinc-500 mb-0.5"><Flag iso={meta.iso} /> {meta.name}</div>
              <div className="text-sm font-semibold text-zinc-100 group-hover:text-white">{title}</div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
              isOpen
                ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                : "border-zinc-700 text-zinc-500"
            }`}>
              {isOpen ? (tl ?? "Open") : "Closed"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span>{poll._count.nominees} nominees</span>
            <span>·</span>
            <span>{poll._count.votes} votes</span>
          </div>

          {!isOpen && leader && (
            <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-2">
              <span className="text-xs text-yellow-500">🏆 Winner:</span>
              <span className="font-mono text-xs text-zinc-200">{leader.upload.plateText}</span>
            </div>
          )}
        </div>
      </a>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">

      {/* ─── Header ─── */}
      <div className="mb-10 flex items-start gap-3">
        <div className="mt-1.5 h-0 w-0 shrink-0 hidden" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Community</p>
          <h1 className="text-3xl font-black text-zinc-50">Community Votes</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Every month, the community votes for the best plate per country. Once a year, a Plate of the Year is crowned.
          </p>
        </div>
      </div>

      {/* ─── Active polls ─── */}
      {open.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-1 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="text-lg font-semibold">Open now</h2>
            <span className="rounded-full bg-emerald-950/40 border border-emerald-800 px-2.5 py-0.5 text-xs text-emerald-400 font-medium">
              {open.length} active
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((p) => <PollCard key={p.numericId} poll={p} />)}
          </div>
        </section>
      )}

      {/* ─── Past polls ─── */}
      {closed.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-1 rounded-full bg-indigo-500 shrink-0" />
            <h2 className="text-lg font-semibold">Past winners</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((p) => <PollCard key={p.numericId} poll={p} />)}
          </div>
        </section>
      )}

      {/* ─── Empty state ─── */}
      {open.length === 0 && closed.length === 0 && (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🗳️</div>
          <p className="text-sm text-zinc-400">No polls yet — the first one opens on the last day of this month.</p>
          <p className="mt-1 text-xs text-zinc-600">Countries need at least 2 spots that month to be eligible.</p>
        </div>
      )}

    </main>
  );
}
