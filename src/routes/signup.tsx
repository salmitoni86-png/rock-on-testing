import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Opprett konto — Kronekort-X" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      toast.error("Brukernavn må være 3–20 tegn (a–z, 0–9, _)");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/app",
        data: { username: u, display_name: displayName || u },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Sjekk e-posten for bekreftelseslenke");
      navigate({ to: "/login" });
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (r.error) toast.error(r.error.message ?? "Google-pålogging feilet");
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <header className="mx-auto flex max-w-md items-center justify-between px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </Link>
      </header>
      <main className="mx-auto max-w-md px-6 pt-12 pb-20">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Opprett konto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Brukernavnet ditt brukes når andre vil dele kortet sitt med deg.
        </p>

        <button
          onClick={google}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
        >
          Registrer med Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> eller med e-post <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Brukernavn (a–z, 0–9)" required maxLength={20}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Visningsnavn (valgfritt)" maxLength={40}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="E-post"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord (min. 6 tegn)" minLength={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit" disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Oppretter konto…" : "Opprett konto"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Har du allerede konto?{" "}
          <Link to="/login" className="font-medium text-foreground underline">
            Logg inn
          </Link>
        </p>
      </main>
    </div>
  );
}
