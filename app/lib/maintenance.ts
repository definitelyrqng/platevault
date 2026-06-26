import { prisma } from "@/app/lib/prisma";

export async function getMaintenanceSettings() {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    return {
      maintenanceMode: s?.maintenanceMode ?? false,
      maintenanceMsg:  s?.maintenanceMsg  ?? "We're doing some technical work. Browsing is available but uploads are paused. Back soon!",
    };
  } catch {
    return { maintenanceMode: false, maintenanceMsg: "" };
  }
}
