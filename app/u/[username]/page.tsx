import { prisma } from "@/app/lib/prisma";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      bio: true,
      createdAt: true,
      _count: { select: { uploads: true, likes: true } },
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold">User not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-xl font-semibold">{user.username}</div>
        <div className="mt-1 text-sm text-zinc-400">
          Uploads: {user._count.uploads} • Likes given: {user._count.likes}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Bio</div>
          <div className="mt-2 text-sm text-zinc-200">
            {user.bio?.trim() ? user.bio : "No bio yet."}
          </div>
        </div>
      </div>
    </main>
  );
}
