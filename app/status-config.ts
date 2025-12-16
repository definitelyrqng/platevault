export type SiteStatus = "offline" | "maintenance" | "online";

export const siteStatus: SiteStatus = "offline";

export const statusInfo: Record<
  SiteStatus,
  {
    label: string;
    headline: string;
    description: string;
    dotBg: string;
    text: string;
    ring: string;
  }
> = {
  offline: {
    label: "Offline",
    headline: "Under construction",
    description: "We’re building PlateVault. Check back soon.",
    dotBg: "bg-red-500",
    text: "text-red-400",
    ring: "ring-red-500/20",
  },
  maintenance: {
    label: "Maintenance",
    headline: "Maintenance in progress",
    description: "We’re doing updates right now. Try again soon.",
    dotBg: "bg-amber-500",
    text: "text-amber-400",
    ring: "ring-amber-500/20",
  },
  online: {
    label: "Online",
    headline: "All systems go",
    description: "PlateVault is live.",
    dotBg: "bg-emerald-500",
    text: "text-emerald-400",
    ring: "ring-emerald-500/20",
  },
};
