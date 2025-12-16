export default function ComingSoon() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-6">
      <div className="max-w-xl text-center">
        <div className="text-3xl font-semibold">PlateVault</div>
        <p className="mt-4 text-zinc-400">
          A modern license plate spotting platform.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-left">
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Status
          </div>
          <div className="mt-2 text-lg font-medium">Under construction</div>
          <p className="mt-2 text-sm text-zinc-400">
            We’re building PlateVault. Check back soon.
          </p>
        </div>

        <p className="mt-8 text-xs text-zinc-600">
          © {new Date().getFullYear()} PlateVault
        </p>
      </div>
    </main>
  );
}
