import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, Users, Hash, Bell } from "lucide-react";
import { useState } from "react";

export const DISCORD_INVITE = "https://discord.gg/kronekort-x";
export const DISCORD_SERVER_ID = "kronekort-x";

export function DiscordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(DISCORD_INVITE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-background/80 backdrop-blur-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#5865F2] via-[#7289DA] to-[#4752C4]">
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-white"
                    style={{
                      left: `${(i * 53) % 100}%`,
                      top: `${(i * 31) % 100}%`,
                      fontSize: `${10 + (i % 4) * 6}px`,
                    }}
                    animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.12 }}
                  >
                    {i % 2 ? "X" : "#"}
                  </motion.span>
                ))}
              </div>
              <button
                onClick={onClose}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50"
                aria-label="Lukk"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Discord</p>
                <p className="font-display text-2xl font-semibold">Kronekort-X Server</p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat icon={<Users className="h-3.5 w-3.5" />} label="Medlemmer" value="2 481" />
                <Stat icon={<Hash className="h-3.5 w-3.5" />} label="Kanaler" value="14" />
                <Stat icon={<Bell className="h-3.5 w-3.5" />} label="Pålogget" value="312" />
              </div>

              <div>
                <p className="text-sm font-semibold">Hva får du?</p>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5865F2]" />
                    Live-varsler når NAV / lønn lander på kortet ditt
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5865F2]" />
                    SoS / VIP-rom for låneforespørsler og rask hjelp
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5865F2]" />
                    Tidlig tilgang til nye funksjoner og beta-tester
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5865F2]" />
                    Direkte chat med teamet og andre brukere
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Invitasjonslenke
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate text-xs">{DISCORD_INVITE}</code>
                  <button
                    onClick={copy}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-card hover:bg-accent"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[color:var(--income)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/30 transition-transform hover:scale-[1.02]"
              >
                Bli med på serveren <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
