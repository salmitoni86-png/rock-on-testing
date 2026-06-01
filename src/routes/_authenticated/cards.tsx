import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Users, Check, X, UserPlus, Lock, LockOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { setCardPin, clearCardPin } from "@/lib/card-pin.functions";

export const Route = createFileRoute("/_authenticated/cards")({
  head: () => ({ meta: [{ title: "Mine kort — Kronekort-X" }] }),
  component: CardsPage,
});

type Card = {
  id: string; name: string; card_number: string; last4: string | null;
  is_active: boolean; last_balance: number | null; owner_id: string;
  owner_name: string | null; pin_hash: string | null;
};
type Member = { card_id: string; user_id: string; role: string; username?: string };
type Req = { id: string; card_id: string; requested_by: string; status: string; username?: string };

function CardsPage() {
  const { user } = useAuth();
  const setPinFn = useServerFn(setCardPin);
  const clearPinFn = useServerFn(clearCardPin);
  const [cards, setCards] = useState<Card[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPin, setNewPin] = useState("");
  const [joinOwner, setJoinOwner] = useState("");
  const [joinLast4, setJoinLast4] = useState("");
  const [addUsername, setAddUsername] = useState<Record<string, string>>({});
  const [pinInput, setPinInput] = useState<Record<string, string>>({});

  async function refresh() {
    const { data: cs } = await supabase.from("cards").select("*").order("created_at", { ascending: false });
    setCards((cs as Card[]) ?? []);
    if (cs && cs.length) {
      const ids = cs.map((c: Card) => c.id);
      const [{ data: ms }, { data: rs }] = await Promise.all([
        supabase.from("card_members").select("*, profiles:profiles!card_members_user_id_fkey(username)").in("card_id", ids),
        supabase.from("card_share_requests").select("*, profiles:profiles!card_share_requests_requested_by_fkey(username)").in("card_id", ids).eq("status", "pending"),
      ]);
      setMembers(((ms as any[]) ?? []).map((m) => ({ ...m, username: m.profiles?.username })));
      setRequests(((rs as any[]) ?? []).map((r) => ({ ...r, username: r.profiles?.username })));
    } else {
      setMembers([]); setRequests([]);
    }
  }
  useEffect(() => { refresh(); }, []);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    const num = newNumber.replace(/\s+/g, "");
    if (!/^\d{8,19}$/.test(num)) return toast.error("Ugyldig kortnummer");
    if (newPin && !/^\d{4,8}$/.test(newPin)) return toast.error("PIN må være 4–8 sifre");
    const { data: created, error } = await supabase.from("cards").insert({
      name: newName.trim() || "DNB Kronekort",
      card_number: num,
      last4: num.slice(-4),
      owner_name: newOwner.trim() || null,
      owner_id: user!.id,
    }).select("id").single();
    if (error) return toast.error(error.message);
    if (newPin && created) {
      try { await setPinFn({ data: { cardId: created.id, pin: newPin } }); }
      catch (err: any) { toast.error(err?.message ?? "Kunne ikke sette PIN"); }
    }
    setNewNumber(""); setNewName(""); setNewOwner(""); setNewPin("");
    toast.success("Kort lagt til");
    refresh();
  }

  async function changePin(cardId: string) {
    const pin = (pinInput[cardId] ?? "").trim();
    if (!/^\d{4,8}$/.test(pin)) return toast.error("PIN må være 4–8 sifre");
    try {
      await setPinFn({ data: { cardId, pin } });
      setPinInput((s) => ({ ...s, [cardId]: "" }));
      toast.success("PIN lagret");
      refresh();
    } catch (err: any) { toast.error(err?.message ?? "Feilet"); }
  }

  async function removePin(cardId: string) {
    try {
      await clearPinFn({ data: { cardId } });
      toast.success("PIN fjernet");
      refresh();
    } catch (err: any) { toast.error(err?.message ?? "Feilet"); }
  }


  async function removeCard(id: string) {
    if (!confirm("Slette kortet?")) return;
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }

  async function joinCard(e: React.FormEvent) {
    e.preventDefault();
    const { data: prof } = await supabase.from("profiles").select("id").eq("username", joinOwner.trim().toLowerCase()).maybeSingle();
    if (!prof) return toast.error("Fant ikke bruker");
    const { data: card } = await supabase.from("cards").select("id").eq("owner_id", prof.id).eq("last4", joinLast4.trim()).maybeSingle();
    if (!card) return toast.error("Fant ikke kort");
    const { error } = await supabase.from("card_share_requests").insert({ card_id: card.id, requested_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("Forespørsel sendt — venter på godkjenning");
    setJoinOwner(""); setJoinLast4("");
  }

  async function resolve(req: Req, accept: boolean) {
    if (accept) {
      const { error: mErr } = await supabase.from("card_members").insert({
        card_id: req.card_id, user_id: req.requested_by, role: "viewer",
      });
      if (mErr) return toast.error(mErr.message);
    }
    await supabase.from("card_share_requests").update({
      status: accept ? "accepted" : "declined", resolved_at: new Date().toISOString(),
    }).eq("id", req.id);
    toast.success(accept ? "Godkjent" : "Avslått");
    refresh();
  }

  async function addMember(cardId: string) {
    const uname = (addUsername[cardId] ?? "").trim().toLowerCase();
    if (!uname) return;
    const { data: prof } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
    if (!prof) return toast.error("Fant ikke bruker");
    const { error } = await supabase.from("card_members").insert({
      card_id: cardId, user_id: prof.id, role: "viewer",
    });
    if (error) return toast.error(error.message);
    toast.success("Lagt til");
    setAddUsername((s) => ({ ...s, [cardId]: "" }));
    refresh();
  }

  async function removeMember(cardId: string, uid: string) {
    const { error } = await supabase.from("card_members").delete().eq("card_id", cardId).eq("user_id", uid);
    if (error) toast.error(error.message); else refresh();
  }

  return (
    <AppShell title="Mine kort" subtitle={`${cards.length} aktiv${cards.length === 1 ? "t" : "e"} kort`}>
      <Toaster position="top-center" />

      {/* Add */}
      <form onSubmit={addCard} className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Legg til DNB Kronekort</p>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Kortnavn (valgfritt)"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="Navn på kortholder"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Kortnummer" inputMode="numeric"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="App-PIN (valgfritt, 4–8 sifre)" inputMode="numeric" maxLength={8} type="password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <p className="text-[11px] text-muted-foreground">PIN-koden låser visning av kortet i appen og lagres kun som en sikker hash — aldri som lesbare sifre.</p>
        <button className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="mr-1 inline h-4 w-4" /> Legg til kort
        </button>
      </form>


      {/* Join */}
      <form onSubmit={joinCard} className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Bli med på et kort</p>
        <p className="text-xs text-muted-foreground">Brukernavnet til eier + siste 4 sifre på kortet.</p>
        <input value={joinOwner} onChange={(e) => setJoinOwner(e.target.value)} placeholder="Brukernavn til eier"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={joinLast4} onChange={(e) => setJoinLast4(e.target.value)} placeholder="Siste 4 sifre" maxLength={4}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <button className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent">
          Send forespørsel
        </button>
      </form>

      <ul className="mt-5 space-y-4">
        {cards.map((c) => {
          const ownerHere = c.owner_id === user?.id;
          const cardMembers = members.filter((m) => m.card_id === c.id);
          const cardReqs = requests.filter((r) => r.card_id === c.id);
          return (
            <li key={c.id} className="space-y-3">
              <div className="balance-card relative overflow-hidden rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/70">DNB · Kronekort</p>
                    <p className="mt-1 font-display text-lg font-semibold">{c.name}</p>
                  </div>
                  {ownerHere && (
                    <button onClick={() => removeCard(c.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="tabular mt-6 font-mono text-base tracking-[0.3em] text-white/80">•••• •••• •••• {c.last4}</p>
                <p className="tabular mt-3 font-display text-2xl font-semibold">
                  {c.last_balance != null ? `${c.last_balance} kr` : "—"}
                </p>
              </div>

              {ownerHere && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" /> Medlemmer
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {cardMembers.map((m) => (
                      <li key={m.user_id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                        <span>@{m.username ?? "—"} <span className="text-xs text-muted-foreground">({m.role})</span></span>
                        {m.role !== "owner" && (
                          <button onClick={() => removeMember(c.id, m.user_id)} className="text-xs text-destructive hover:underline">
                            Fjern
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={addUsername[c.id] ?? ""}
                      onChange={(e) => setAddUsername((s) => ({ ...s, [c.id]: e.target.value }))}
                      placeholder="Legg til brukernavn"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button onClick={() => addMember(c.id)} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>

                  {cardReqs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Forespørsler</p>
                      <ul className="mt-2 space-y-1.5">
                        {cardReqs.map((r) => (
                          <li key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                            <span>@{r.username ?? "—"}</span>
                            <div className="flex gap-1">
                              <button onClick={() => resolve(r, true)} className="grid h-7 w-7 place-items-center rounded-md bg-[color:var(--income)]/20 text-[color:var(--income)]">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => resolve(r, false)} className="grid h-7 w-7 place-items-center rounded-md bg-destructive/20 text-destructive">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {cards.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen kort enda. Legg til et over.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
