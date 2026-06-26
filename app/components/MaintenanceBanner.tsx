import { getMaintenanceSettings } from "@/app/lib/maintenance";

export default async function MaintenanceBanner() {
  const { maintenanceMode, maintenanceMsg } = await getMaintenanceSettings();
  if (!maintenanceMode) return null;

  return (
    <div className="relative z-50 bg-amber-950/90 border-b border-amber-700/50 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl flex items-center gap-3 px-4 py-2.5">
        <span className="text-base shrink-0">🔧</span>
        <p className="text-sm text-amber-200 leading-tight">
          <span className="font-semibold text-amber-300">Maintenance mode — </span>
          {maintenanceMsg}
        </p>
      </div>
    </div>
  );
}
