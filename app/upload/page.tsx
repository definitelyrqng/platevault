import Flag from "@/app/components/Flag";

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
];

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="mt-1 h-6 w-1 rounded-full bg-indigo-500 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Upload a spot</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Select a country to continue. Each country has its own upload form and plate types.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {COUNTRIES.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="group flex items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-indigo-800/60 hover:bg-indigo-950/20 hover:shadow-md hover:shadow-indigo-950/40 transition-all"
          >
            {/* Flag PNG */}
            <span className="shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Flag iso={c.iso} size="lg" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-zinc-200 group-hover:text-indigo-200 transition-colors">
                {c.name}
              </div>
              <div className="mt-0.5 text-sm text-zinc-500">{c.desc}</div>
            </div>
            <svg
              className="h-4 w-4 text-zinc-700 group-hover:text-indigo-500 transition-colors shrink-0"
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

        {/* Coming soon */}
        <div className="flex items-center gap-5 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 px-5 py-4 opacity-40">
          <span className="shrink-0">
            <Flag iso="de" size="lg" />
          </span>
          <div>
            <div className="font-semibold text-zinc-300">Germany</div>
            <div className="mt-0.5 text-sm text-zinc-600">Coming soon</div>
          </div>
        </div>
      </div>
    </main>
  );
}
