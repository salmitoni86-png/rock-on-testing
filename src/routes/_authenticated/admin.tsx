import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Kronekort-X" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [visits, setVisits] = useState<number>(0);
  const [convos, setConvos] = useState<Array<{ id: string; needs_human: boolean; created_at: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
    supabase.from("site_visits").select("id", { count: "exact", head: true })
      .gt("created_at", new Date(Date.now() - 24 * 3600_000).toISOString())
      .then(({ count }) => setVisits(count ?? 0));
    supabase.from("support_conversations").select("id,needs_human,created_at").eq("needs_human", true)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setConvos(data ?? []));
  }, [user]);

  if (isAdmin === null) return <AppShell title="Admin"><p className="text-sm text-muted-foreground">Sjekker tilgang…</p></AppShell>;
  if (!isAdmin) return (
    <AppShell title="Admin">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="font-medium">Du har ikke admin-tilgang.</p>
        <p className="mt-2 text-xs text-muted-foreground">Be en admin om å gi deg rollen via brukerroller-tabellen.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Admin" subtitle="NetGuard + moderering">
      <Toaster position="top-center" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Besøk siste 24t" value={visits} />
        <Stat label="Support i kø" value={convos.length} />
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Support-saker som venter på menneske</p>
        {convos.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Ingen i kø.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {convos.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                <span className="font-mono text-xs">{c.id.slice(0, 8)}…</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("nb-NO")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">NetGuard</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Hendelser fra NetGuard kommer hit. Konfigurer webhook-URL <code className="font-mono">/api/public/netguard/ingest</code> i NetGuard-systemet ditt.
        </p>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
