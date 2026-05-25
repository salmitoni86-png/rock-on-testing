import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { LANGS, useLang, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ floating = true }: { floating?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div
      ref={ref}
      className={
        floating
          ? "fixed top-4 right-4 z-40"
          : "relative inline-block"
      }
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Bytt språk"
        className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-sm shadow-lg backdrop-blur hover:bg-accent"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          {current.code}
        </span>
        <Globe className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code as Lang);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                l.code === lang ? "bg-primary/10 font-medium" : ""
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                {l.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
