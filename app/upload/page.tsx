import Flag from "@/app/components/Flag";

export const metadata = {
  title: "Upload a Spot",
  description: "Upload a license plate photo to PlateVault. Select your country and fill in the details.",
  openGraph: { title: "Upload a Spot · PlateVault", description: "Add your plate to the archive." },
};

const COUNTRIES = [
  {
    href: "/upload/albania",
    name: "Albania",
    iso: "al",
    desc: "Cars, motorcycles, trailers — modern and legacy Albanian plates",
  },
  {
    href: "/upload/austria",
    name: "Austria",
    iso: "at",
    desc: "Regular, electric, vanity, official, export transit, provisional, diplomatic and more",
  },
  {
    href: "/upload/belgium",
    name: "Belgium",
    iso: "be",
    desc: "Regular, oldtimer, motorcycle, taxi, trailer, dealer, diplomatic and more — with auto-detection",
  },
  {
    href: "/upload/bosnia",
    name: "Bosnia & Herzegovina",
    iso: "ba",
    desc: "Regular, taxi, provisional and 1998 year system plates",
  },
  {
    href: "/upload/bulgaria",
    name: "Bulgaria",
    iso: "bg",
    desc: "Standard, motorcycle, military, vanity, temporary, diplomatic and foreign registered plates",
  },
  {
    href: "/upload/croatia",
    name: "Croatia",
    iso: "hr",
    desc: "Regular, foreign, exceptional, motorcycle, vanity, dealer, oldtimer, military, export and police plates",
  },
  {
    href: "/upload/czech",
    name: "Czech Republic",
    iso: "cz",
    desc: "Regular, motorcycle, dealer, sportscar, oldtimer, electric, vanity, diplomatic, export, foreign and historical (1960) plates",
  },
  {
    href: "/upload/germany",
    name: "Germany",
    iso: "de",
    desc: "Single-line, two-line, US-style, motorcycles — modern euroband & historical DIN plates with all district codes",
  },
];

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-50">Upload a spot</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Select a country to continue. Each one has its own form and plate types.
        </p>
      </div>

      <div className="grid gap-3">
        {COUNTRIES.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="group flex items-center gap-5 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 px-5 py-4 hover:border-indigo-700/60 hover:bg-indigo-950/20 hover:shadow-lg hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all"
          >
            <span className="shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Flag iso={c.iso} size="lg" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-zinc-100 group-hover:text-indigo-200 transition-colors">
                {c.name}
              </div>
              <div className="mt-0.5 text-sm text-zinc-500">{c.desc}</div>
            </div>
            <svg
              className="h-4 w-4 text-zinc-700 group-hover:text-indigo-400 transition-colors shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        ))}
      </div>
    </main>
  );
}
