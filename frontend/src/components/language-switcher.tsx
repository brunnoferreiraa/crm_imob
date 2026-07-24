"use client";
import { useLanguage } from "@/providers/language-provider";
export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 shadow-sm transition hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900">
      <Flag locale={locale} />
      <select
        aria-label="Idioma / Language"
        value={locale}
        onChange={(e) => setLocale(e.target.value as "pt" | "en")}
        className="h-10 bg-transparent px-1 text-xs font-bold"
      >
        <option value="pt">PT</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}

function Flag({ locale }: { locale: "pt" | "en" }) {
  if (locale === "pt")
    return (
      <svg
        role="img"
        aria-label="Bandeira do Brasil"
        viewBox="0 0 28 20"
        className="h-4 w-6 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10"
      >
        <rect width="28" height="20" fill="#169B62" />
        <path d="M14 2.5 25 10 14 17.5 3 10Z" fill="#FFDF00" />
        <circle cx="14" cy="10" r="4.2" fill="#002776" />
        <path d="M10.2 9.1c2.5-.8 5.3-.4 7.7 1" fill="none" stroke="white" strokeWidth=".7" />
      </svg>
    );
  return (
    <svg
      role="img"
      aria-label="United States flag"
      viewBox="0 0 28 20"
      className="h-4 w-6 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10"
    >
      <rect width="28" height="20" fill="white" />
      {[0, 4, 8, 12, 16].map((y) => (
        <rect key={y} y={y} width="28" height="2" fill="#B22234" />
      ))}
      <rect width="12" height="10.8" fill="#3C3B6E" />
      {[2, 6, 10].flatMap((x) =>
        [2, 5, 8].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".55" fill="white" />),
      )}
    </svg>
  );
}
