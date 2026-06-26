import { getMaintenanceSettings } from "@/app/lib/maintenance";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

async function isSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pv_session")?.value;
  if (!token) return false;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { user: { select: { role: true } } },
  });
  return session?.user.role === "SUPERADMIN";
}

export default async function UploadLayout({ children }: { children: React.ReactNode }) {
  const [{ maintenanceMode, maintenanceMsg }, superAdmin] = await Promise.all([
    getMaintenanceSettings(),
    isSuperAdmin(),
  ]);

  return (
    <>
      {maintenanceMode && !superAdmin && (
        <div className="sticky top-0 z-40 bg-amber-950/95 border-b border-amber-700/50 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
            <span className="text-lg shrink-0">🔧</span>
            <div>
              <p className="text-sm font-semibold text-amber-300">Uploads paused</p>
              <p className="text-xs text-amber-200/80">{maintenanceMsg}</p>
            </div>
          </div>
        </div>
      )}
      {maintenanceMode && superAdmin && (
        <div className="sticky top-0 z-40 bg-indigo-950/95 border-b border-indigo-700/50 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
            <span className="text-lg shrink-0">🔧</span>
            <p className="text-sm text-indigo-300">
              <span className="font-semibold">Maintenance mode is ON</span> — you can still upload as superadmin.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
