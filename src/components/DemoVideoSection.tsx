import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Play, Heart, MessageCircle, Share2, Sparkles } from "lucide-react";

const REACTIONS = [
  { emoji: "🤩", x: "12%", y: "30%", delay: 0.2 },
  { emoji: "❤️", x: "78%", y: "22%", delay: 0.6 },
  { emoji: "🔥", x: "20%", y: "70%", delay: 1.0 },
  { emoji: "✨", x: "82%", y: "65%", delay: 1.4 },
  { emoji: "😍", x: "50%", y: "12%", delay: 1.8 },
];

const QUOTES = [
  { who: "Ida, 28", text: "Endelig — saldo uten BankID-styr." },
  { who: "Magnus & familien", text: "Vi deler kortet uten å dele passord." },
  { who: "Sara, frilanser", text: "Push idet NAV lander. Genialt." },
];

export function DemoVideoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Play className="h-3 w-3" /> Se Kronekort-X i bruk
        </span>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Når vennene dine oppdager appen
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Et lite gløtt inn i hvordan folk reagerer første gang de ser saldoen oppdatere seg av seg selv.
        </p>
      </div>

      <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-background to-card p-6 sm:p-10">
        {/* Browser-chrome frame */}
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            <span className="ml-3 text-[11px] text-muted-foreground">kronekort-x.no</span>
          </div>

          <div className="relative aspect-video overflow-hidden">
            {/* Friends "scene" - three avatars huddled around a phone */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-[color:var(--bcard-c)]/10" />

            {/* Faux avatars */}
            <div className="absolute inset-0 flex items-end justify-center gap-4 pb-8 sm:pb-12">
              {[
                { c: "from-pink-400 to-orange-400", n: "I", d: 0.0 },
                { c: "from-violet-400 to-blue-500", n: "M", d: 0.2 },
                { c: "from-emerald-400 to-teal-500", n: "S", d: 0.4 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ delay: p.d, duration: 0.6, ease: "easeOut" }}
                  className="relative"
                >
                  <div
                    className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${p.c} font-display text-2xl font-bold text-white shadow-lg sm:h-20 sm:w-20`}
                  >
                    {p.n}
                  </div>
                  {/* Speech bubble */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: p.d + 0.8, type: "spring", stiffness: 200 }}
                    className="absolute -top-3 -right-3 grid h-7 w-7 place-items-center rounded-full bg-card text-sm shadow-md"
                  >
                    {["😮", "🤯", "🥹"][i]}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Phone in the middle, tilting */}
            <motion.div
              initial={{ y: 60, opacity: 0, rotate: -6 }}
              animate={inView ? { y: 0, opacity: 1, rotate: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative h-44 w-24 rounded-[1.4rem] border-4 border-foreground/80 bg-background shadow-2xl sm:h-56 sm:w-32">
                <div className="absolute left-1/2 top-1 h-1 w-8 -translate-x-1/2 rounded-full bg-foreground/40" />
                <div className="absolute inset-2 overflow-hidden rounded-[1rem] bg-gradient-to-br from-primary to-[color:var(--bcard-c)] p-2 text-white">
                  <p className="text-[7px] uppercase tracking-widest opacity-70">Saldo</p>
                  <motion.p
                    key={inView ? "live" : "idle"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.2, duration: 0.4 }}
                    className="font-display text-sm font-bold sm:text-lg"
                  >
                    +42 180
                  </motion.p>
                  <p className="text-[7px] opacity-70">kr</p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 1.8 }}
                    className="mt-2 rounded-md bg-white/15 px-1.5 py-1 text-[7px]"
                  >
                    <Sparkles className="mr-0.5 inline h-2 w-2" /> NAV 08:00
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Floating reaction emojis */}
            {REACTIONS.map((r, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 0, scale: 0.4 }}
                animate={inView ? { opacity: [0, 1, 1, 0], y: -80, scale: [0.4, 1.2, 1, 0.8] } : {}}
                transition={{ delay: r.delay, duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ left: r.x, top: r.y }}
                className="absolute text-2xl"
              >
                {r.emoji}
              </motion.span>
            ))}
          </div>

          {/* Social-action bar like a real video */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-400" /> 2.4k</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 318</span>
              <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> 1.1k</span>
            </div>
            <span className="font-mono">0:14 / 0:30</span>
          </div>
        </div>

        {/* Rotating testimonial quotes */}
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.5 + i * 0.15 }}
              className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur"
            >
              <blockquote className="text-sm">"{q.text}"</blockquote>
              <figcaption className="mt-2 text-xs text-muted-foreground">— {q.who}</figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
