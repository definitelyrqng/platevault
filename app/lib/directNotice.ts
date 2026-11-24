import { prisma } from "@/app/lib/prisma";

export type DirectNotice = { enabled: boolean; title: string; text: string; link: string; linkText: string };

export const DEFAULT_DIRECT_NOTICE: DirectNotice = {
  enabled: true,
  title: "Heads up",
  text: "PlateVault is still being built — things may change or break while we work on it.",
  link: "",
  linkText: "",
};

/** The notice for visitors who open the site directly (falls back to the defaults if the database can't be read). */
export async function getDirectNotice(): Promise<DirectNotice> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!s) return DEFAULT_DIRECT_NOTICE;
    return { enabled: s.directNoticeEnabled, title: s.directNoticeTitle, text: s.directNoticeText, link: s.directNoticeLink, linkText: s.directNoticeLinkText };
  } catch {
    return DEFAULT_DIRECT_NOTICE;
  }
}
