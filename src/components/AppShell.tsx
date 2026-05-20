import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-start justify-between pb-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </header>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
