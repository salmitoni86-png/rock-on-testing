import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LivingBackground } from "@/components/LivingBackground";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blogg — Kronekort-X" },
      { name: "description", content: "Tips, oppdateringer og historier fra Kronekort-X." },
      { property: "og:title", content: "Blogg — Kronekort-X" },
      { property: "og:description", content: "Tips, oppdateringer og historier fra Kronekort-X." },
    ],
  }),
  component: BlogIndex,
});

type Post = { id: string; slug: string; title: string; excerpt: string | null; cover_url: string | null; published_at: string | null; category_id: string | null };
type Cat = { id: string; name: string; slug: string };

function BlogIndex() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("blog_categories").select("id,name,slug").then(({ data }) => setCats(data ?? []));
    supabase
      .from("blog_posts")
      .select("id,slug,title,excerpt,cover_url,published_at,category_id")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .then(({ data }) => setPosts(data ?? []));
  }, []);

  const filtered = filter ? posts.filter((p) => p.category_id === filter) : posts;

  return (
    <div className="relative min-h-screen bg-background">
      <LivingBackground density={10} />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
        <Link to="/" className="font-display text-lg font-semibold">Kronekort-X</Link>
        <nav className="text-sm">
          <Link to="/about" className="px-3 py-2 text-muted-foreground hover:text-foreground">Om</Link>
          <Link to="/login" className="px-3 py-2 text-muted-foreground hover:text-foreground">Logg inn</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Blogg</h1>
        <p className="mt-2 text-muted-foreground">Tips, oppdateringer og historier.</p>

        {cats.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs ${filter === null ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
            >
              Alle
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`rounded-full border px-3 py-1 text-xs ${filter === c.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {filtered.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Ingen innlegg publisert enda. Sjekk tilbake snart!
            </p>
          )}
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-accent/40"
            >
              {p.cover_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold tracking-tight">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {p.published_at && new Date(p.published_at).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
