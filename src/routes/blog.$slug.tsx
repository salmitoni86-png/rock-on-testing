import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { LivingBackground } from "@/components/LivingBackground";
import { ShareBar } from "@/components/ShareBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Innlegg — Kronekort-X Blogg" },
    ],
  }),
  component: BlogPost,
});

type Post = { id: string; title: string; body_md: string; excerpt: string | null; cover_url: string | null; published_at: string | null };
type Comment = { id: string; body: string; created_at: string; author_id: string };

function BlogPost() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const { user } = useAuth();
  const { t, fmt } = useLang();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("blog_posts")
        .select("id,title,body_md,excerpt,cover_url,published_at")
        .eq("slug", slug)
        .maybeSingle();
      setPost(p as Post | null);
      if (p) await loadComments(p.id);
      setLoading(false);
    })();
  }, [slug]);

  async function loadComments(postId: string) {
    const { data } = await supabase
      .from("blog_comments")
      .select("id,body,created_at,author_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Comment[];
    setComments(list);
    const ids = Array.from(new Set(list.map((c) => c.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,username").in("id", ids);
      const map: Record<string, string> = {};
      for (const p of profs ?? []) map[p.id] = p.username;
      setProfiles(map);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !post || !body.trim()) return;
    const { error } = await supabase.from("blog_comments").insert({ post_id: post.id, author_id: user.id, body: body.trim() });
    if (error) {
      toast.error(t("commentFailed"));
    } else {
      setBody("");
      toast.success(t("commentAdded"));
      loadComments(post.id);
    }
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">{t("loadingWord")}</div>;
  if (!post) return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("postNotFound")}</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary underline">{t("backToBlog")}</Link>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background">
      <Toaster position="top-center" />
      <LivingBackground density={8} />
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backToBlog")}
        </Link>
        {post.cover_url && <img src={post.cover_url} alt="" className="mt-6 aspect-video w-full rounded-2xl object-cover" />}
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        {post.published_at && (
          <p className="mt-2 text-sm text-muted-foreground">
            {fmt.date(post.published_at, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-foreground/90">{post.body_md}</div>

        <div className="mt-10">
          <ShareBar title={post.title} />
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">{t("commentsTitle")} ({comments.length})</h2>
          {user ? (
            <form onSubmit={submitComment} className="mt-4 flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("commentPh")}
                maxLength={1000}
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Link to="/login" className="text-primary underline">{t("loginWord")}</Link> {t("loginToComment")}
            </p>
          )}
          <ul className="mt-6 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm">{c.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  @{profiles[c.author_id] ?? t("anonWord")} · {fmt.date(c.created_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
