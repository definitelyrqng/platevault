import type { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";
import { toSlug } from "@/app/lib/chassis";

export const dynamic = "force-dynamic";
const BASE = "https://www.platevault.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const visible = { deletedAt: null, hidden: false };
  const [spots, countries, brands, users, companies] = await Promise.all([
    prisma.upload.findMany({ where: visible, orderBy: { createdAt: "desc" }, take: 40000, select: { numericId: true, createdAt: true } }),
    prisma.upload.groupBy({ by: ["country"], where: visible }),
    prisma.upload.groupBy({ by: ["brand"], where: { ...visible, brand: { not: null } } }),
    prisma.user.findMany({ select: { numericId: true }, take: 5000 }),
    prisma.transportCompany.findMany({ select: { numericId: true }, take: 2000 }),
  ]);
  const now = new Date();
  const fixed = ["/countries", "/catalog", "/companies", "/leaderboard", "/quiz", "/rules", "/contact", "/legal"];
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...fixed.map((p) => ({ url: BASE + p, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...countries.map((c) => ({ url: `${BASE}/c/${c.country}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brands.filter((b) => b.brand).map((b) => ({ url: `${BASE}/catalog/${toSlug(b.brand!)}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...companies.map((c) => ({ url: `${BASE}/companies/${c.numericId}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...users.map((u) => ({ url: `${BASE}/u/${u.numericId}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.3 })),
    ...spots.map((s) => ({ url: `${BASE}/spot/${s.numericId}`, lastModified: s.createdAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
