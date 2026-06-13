import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import VoteButton from "./VoteButton";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";


const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function timeLeft(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} left`;
  const hours = Math.floor(ms / 3_600_000);
  return `${hours}h left`;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export default async function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return notFound();

  const [poll, currentUser] = await Promise.all([
    prisma.poll.findUnique({
      where: { numericId },
      select: {
        id: true,
        numericId: true,
        country: true,
        type: true,
        year: true,
        month: true,
        opensAt: true,
        closesAt: true,
        nominees: {
          select: {
            id: true,
            upload: {
              select: {
                numericId: true,
                plateText: true,
                imageUrl: true,
                brand: true,
                model: true,
                location: true,
                _count: { select: { likes: true } },
              },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!poll) return notFound();

  const now = new Date();
  const isOpen = poll.closesAt > now;

  // Did this user vote?
  const userVote = currentUser
    ? await prisma.pollVote.findUnique({
        where: { pollId_userId: { pollId: poll.id, userId: currentUser.id } },
        select: { nomineeId: true },
      })
    : null;

  const userVotedNomineeId = userVote?.nomineeId ?? null;
  const showVoteCounts = !isOpen || userVote !== null;

  const meta = COUNTRY_META[poll.country] ?? {
    iso: null,
    name: poll.country.charAt(0).toUpperCase() + poll.country.slice(1),
  };

  const pollTitle =
    poll.type === "YEARLY"
      ? `Plate of the Year ${poll.year}`
      : `Plate of the Month — ${MONTH_NAMES[poll.month]} ${poll.year}`;

  // Sort nominees: winner first if closed, otherwise by upload likes
  const nominees = [...poll.nominees].sort((a, b) =>
    showVoteCounts
      ? b._count.votes - a._count.votes
      : b.upload._count.likes - a.upload._count.likes
  );

  const winner = !isOpen && nominees.length > 0 ? nominees[0] : null;
  const totalVotes = poll._count.votes;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16 pt-8">

      {/* ─── Header ─── */}
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
        <a href="/polls" className="hover:text-zinc-300">Polls</a>
        <span>›</span>
        <span><Flag iso={meta.iso} /> {meta.name}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl"><Flag iso={meta.iso} /></span>
            <h1 className="text-2xl font-bold text-zinc-50">{pollTitle}</h1>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              isOpen
                ? "border-emerald-700 bg-emerald-950/40 text-emerald-400"
                : "border-zinc-700 bg-zinc-900/40 text-zinc-400"
            }`}>
              {isOpen ? "🟢 Open" : "🔒 Closed"}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {isOpen
              ? `${timeLeft(poll.closesAt)} · ${totalVotes} vote${totalVotes === 1 ? "" : "s"} cast so far`
              : `Closed · ${totalVotes} total vote${totalVotes === 1 ? "" : "s"}`}
          </p>
          {isOpen && !userVote && currentUser && (
            <p className="mt-1 text-xs text-indigo-400">Pick your favourite plate below. You get one vote!</p>
          )}
          {userVote && (
            <p className="mt-1 text-xs text-zinc-500">You&apos;ve voted — results shown below.</p>
          )}
        </div>
      </div>

      {/* ─── Winner banner ─── */}
      {winner && !isOpen && (
        <div className="mb-8 rounded-2xl border border-yellow-700/50 bg-yellow-950/20 px-6 py-4 flex items-center gap-4">
          <span className="text-3xl shrink-0">🏆</span>
          <div>
            <div className="text-sm font-semibold text-yellow-300">Winner</div>
            <div className="font-mono text-xl font-bold text-zinc-100">{winner.upload.plateText}</div>
            {winner.upload.brand && (
              <div className="text-xs text-zinc-400 mt-0.5">{[winner.upload.brand, winner.upload.model].filter(Boolean).join(" ")}</div>
            )}
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-yellow-300">{winner._count.votes}</div>
            <div className="text-xs text-zinc-500">votes</div>
          </div>
        </div>
      )}

      {/* ─── Nominees grid ─── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {nominees.map((nominee, idx) => {
          const u = nominee.upload;
          const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
          const isWinner = !isOpen && idx === 0;
          const votePercent = showVoteCounts && totalVotes > 0
            ? Math.round((nominee._count.votes / totalVotes) * 100)
            : null;

          return (
            <div
              key={nominee.id}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all ${
                isWinner
                  ? "border-yellow-700/50 bg-zinc-900/60 shadow-lg shadow-yellow-950/20"
                  : userVotedNomineeId === nominee.id
                  ? "border-indigo-700/50 bg-zinc-900/60"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              {isWinner && (
                <div className="absolute top-2.5 left-2.5 z-10 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-zinc-950">
                  🏆 Winner
                </div>
              )}

              {/* Image */}
              <a href={`/spot/${u.numericId}`} className="block aspect-video bg-zinc-950 overflow-hidden group">
                <img
                  src={u.imageUrl}
                  alt={u.plateText}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </a>

              <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                  <div className="font-mono text-lg font-bold tracking-widest text-zinc-100">{u.plateText}</div>
                  {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                  {u.location && <div className="text-xs text-zinc-500 mt-0.5">📍 {u.location}</div>}
                </div>

                <div className="text-xs text-zinc-600">♡ {u._count.likes} likes</div>

                {/* Vote bar — shown after voting or when closed */}
                {showVoteCounts && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{nominee._count.votes} vote{nominee._count.votes !== 1 ? "s" : ""}</span>
                      <span className="text-zinc-500">{votePercent ?? 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWinner ? "bg-yellow-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${votePercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <VoteButton
                    pollNumericId={poll.numericId}
                    nomineeId={nominee.id}
                    userVotedNomineeId={userVotedNomineeId}
                    pollOpen={isOpen}
                    isLoggedIn={!!currentUser}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </main>
  );
}
