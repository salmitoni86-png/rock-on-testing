import { useEffect } from "react";
import { loadSettings } from "@/lib/kronekort";

function apply() {
  if (typeof window === "undefined") return;
  const s = loadSettings();
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = s.theme === "dark" || (s.theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  root.setAttribute("data-accent", s.accent);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    apply();
    const onSettings = () => apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => apply();
    window.addEventListener("kronekort:settings", onSettings);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("kronekort:settings", onSettings);
      mq.removeEventListener("change", onMq);
    };
  }, []);
  return <>{children}</>;
}
