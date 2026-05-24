import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserPlus, Check, X, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({ meta: [{ title: "Venner — Kronekort-X" }] }),
  component: FriendsPage,
});

type Friendship = { id: string; requester_id: string; addressee_id: string; status: string };

function FriendsPage() {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username: string; display_name: string | null }>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string }>>([]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const list = (data ?? []) as Friendship[];
    setFriendships(list);
    const ids = Array.from(new Set(list.flatMap((f) => [f.requester_id, f.addressee_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,username,display_name").in("id", ids);
      const map: Record<string, { username: string; display_name: string | null }> = {};
      for (const p of profs ?? []) map[p.id] = { username: p.username, display_name: p.display_name };
      setProfiles(map);
    }
  }
  useEffect(() => { load(); }, [user]);

  async function doSearch() {
    if (!search.trim()) return setSearchResults([]);
    const { data } = await supabase.from("profiles").select("id,username").ilike("username", `%${search}%`).limit(10);
    setSearchResults((data ?? []).filter((p) => p.id !== user?.id));
  }

  async function sendRequest(toId: string) {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: toId });
    if (error) toast.error(error.message); else { toast.success("Forespørsel sendt"); load(); setSearchResults([]); setSearch(""); }
  }
  async function accept(id: string) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    toast.success("Venn lagt til"); load();
  }
  async function decline(id: string) {
    await supabase.from("friendships").delete().eq("id", id); load();
  }

  if (!user) return null;
  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user.id);

  return (
    <AppShell title="Venner" subtitle={`${accepted.length} venner`}>
      <Toaster position="top-center" />
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Finn venner</p>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Søk på brukernavn…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button onClick={doSearch} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Søk</button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-2">
            {searchResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                <span className="text-sm">@{r.username}</span>
                <button onClick={() => sendRequest(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground">
                  <UserPlus className="h-3 w-3" /> Legg til
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Forespørsler ({incoming.length})</p>
          <ul className="mt-3 space-y-2">
            {incoming.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                <span className="text-sm">@{profiles[f.requester_id]?.username ?? "ukjent"}</span>
                <div className="flex gap-1">
                  <button onClick={() => accept(f.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--income)]/15 text-[color:var(--income)]"><Check className="h-4 w-4" /></button>
                  <button onClick={() => decline(f.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/15 text-destructive"><X className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Vennene dine</p>
        {accepted.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">Ingen venner enda. Søk etter et brukernavn over!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {accepted.map((f) => {
              const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
              const p = profiles[otherId];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium">{p?.display_name ?? `@${p?.username ?? "ukjent"}`}</p>
                    {p?.display_name && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                  </div>
                  <button onClick={() => decline(f.id)} className="text-xs text-muted-foreground hover:text-destructive">Fjern</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Ventende ({outgoing.length})</p>
          <ul className="mt-3 space-y-2">
            {outgoing.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-sm">
                <span>@{profiles[f.addressee_id]?.username ?? "ukjent"}</span>
                <span className="text-xs text-muted-foreground">venter…</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
