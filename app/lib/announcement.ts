import { prisma } from "@/app/lib/prisma";

export type Announcement = {
  enabled: boolean;
  label: string;
  text: string;
  link: string;
  linkText: string;
  /** How many days a visitor sees it after first seeing it (0 = until they dismiss it). */
  days: number;
  /** Bumped to show the banner again to people who dismissed it. */
  version: number;
};

export const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: true,
  label: "New",
  text: "Weekly challenges, direct messages, road trips, collection export & Germany plates are live.",
  link: "/challenges",
  linkText: "Try now →",
  days: 14,
  version: 1,
};

/** The "What's new" banner settings (falls back to the defaults if the database can't be read). */
export async function getAnnouncement(): Promise<Announcement> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!s) return DEFAULT_ANNOUNCEMENT;
    return {
      enabled: s.announcementEnabled,
      label: s.announcementLabel,
      text: s.announcementText,
      link: s.announcementLink,
      linkText: s.announcementLinkText,
      days: s.announcementDays,
      version: s.announcementVersion,
    };
  } catch {
    return DEFAULT_ANNOUNCEMENT;
  }
}
