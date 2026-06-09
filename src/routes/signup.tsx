import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/use-auth";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Opprett konto — Kronekort-X" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) {
      const clean = ref.trim().toLowerCase().slice(0, 32);
      setRefCode(clean);
      try { localStorage.setItem("kkx_ref_code", clean); } catch {}
    } else {
      try {
        const stored = localStorage.getItem("kkx_ref_code");
        if (stored) setRefCode(stored);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      toast.error(t("usernameRule"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/app",
        data: {
          username: u,
          display_name: displayName || u,
          ...(refCode ? { ref_code: refCode } : {}),
        },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      try { localStorage.removeItem("kkx_ref_code"); } catch {}
      toast.success(t("checkEmailConfirm"));
      navigate({ to: "/login" });
    }
  }

  async function google() {
    if (refCode) {
      try { localStorage.setItem("kkx_ref_code", refCode); } catch {}
    }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (r.error) toast.error(r.error.message ?? t("googleFailed"));
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <header className="mx-auto flex max-w-md items-center justify-between px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backWord")}
        </Link>
      </header>
      <main className="mx-auto max-w-md px-6 pt-12 pb-20">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("signupTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("signupSub")}
        </p>
        {refCode && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--income)]/40 bg-[color:var(--income)]/10 px-3 py-1.5 text-xs text-[color:var(--income)]">
            🎁 {t("invitedWithCode")} <span className="font-mono font-semibold">{refCode}</span>
          </div>
        )}

        <button
          onClick={google}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
        >
          {t("registerGoogle")}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> {t("orEmail")} <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder={t("usernamePh")} required maxLength={20}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("displayNamePh")} maxLength={40}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlain")}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordMinPh")} minLength={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit" disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t("creatingAccount") : t("createAccountBtn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link to="/login" className="font-medium text-foreground underline">
            {t("loginWord")}
          </Link>
        </p>
      </main>
    </div>
  );
}
