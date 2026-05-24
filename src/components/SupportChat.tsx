import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, UserCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendSupportMessage } from "@/lib/support.functions";

type Msg = { role: "user" | "assistant"; body: string };

const INTRO: Msg = {
  role: "assistant",
  body: "Hei! 👋 Jeg er Kronekort-X sin AI-assistent. Hva kan jeg hjelpe deg med i dag? (Skriv 'menneske' om du vil snakke med support.)",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const send = useServerFn(sendSupportMessage);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", body: text }]);
    setInput("");
    setSending(true);
    try {
      let anonId = localStorage.getItem("kkx_chat_aid");
      if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem("kkx_chat_aid", anonId);
      }
      const res = await send({ data: { conversationId: convId, anonId, body: text } });
      setConvId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", body: res.reply }]);
      if (res.needsHuman) setEscalated(true);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", body: "Beklager — noe gikk galt. Prøv igjen om litt." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Åpne support-chat"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--income)] text-[10px] font-bold text-background">
            1
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[32rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <header className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/15 to-[color:var(--bcard-c)]/15 px-4 py-3">
              <div className="relative">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-[color:var(--income)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Kronekort-X Support</p>
                <p className="text-[11px] text-muted-foreground">
                  {escalated ? "Venter på menneske…" : "AI-assistent · på nett"}
                </p>
              </div>
            </header>

            <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
              {escalated && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--income)]/30 bg-[color:var(--income)]/10 px-3 py-2 text-xs">
                  <UserCheck className="h-4 w-4 text-[color:var(--income)]" />
                  Henvendelsen din er flagget for et menneske. De svarer så fort de kan.
                </div>
              )}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Skriver…
                </div>
              )}
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Skriv en melding…"
                className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
