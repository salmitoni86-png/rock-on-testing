import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useActivityLevel } from "@/hooks/use-activity-level";

// Floating "X" glyphs + "kronekort-x" wordmarks drifting in the background.
// Pure CSS transforms — GPU-friendly. Respects prefers-reduced-motion.
export function LivingBackground({ density = 14 }: { density?: number }) {
  const reduced = useReducedMotion();
  const activity = useActivityLevel();
  // Active → ~0.8, idle → ~0.1. Smoothly interpolated by the activity hook.
  const wordmarkOpacity = reduced ? 0.12 : 0.1 + activity * 0.7;

  const items = useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      kind: i % 4 === 0 ? "word" : "x",
      x: rng() * 100,
      y: rng() * 100,
      size: 60 + rng() * 280,
      rot: rng() * 60 - 30,
      delay: rng() * 8,
      dur: 14 + rng() * 18,
      opacity: 0.04 + rng() * 0.08,
    }));
  }, [density]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent),radial-gradient(60%_50%_at_100%_100%,color-mix(in_oklab,var(--bcard-c)_18%,transparent),transparent)]" />
      {items.map((it) =>
        it.kind === "x" ? (
          <motion.span
            key={it.id}
            initial={{ x: 0, y: 0, rotate: it.rot }}
            animate={
              reduced
                ? undefined
                : { x: [0, 30, -20, 0], y: [0, -40, 20, 0], rotate: [it.rot, it.rot + 12, it.rot - 8, it.rot] }
            }
            transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: "easeInOut" }}
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              fontSize: it.size,
              opacity: it.opacity,
            }}
            className="absolute font-display font-black leading-none text-foreground"
          >
            X
          </motion.span>
        ) : (
          <motion.span
            key={it.id}
            initial={{ x: 0, y: 0, rotate: it.rot * 0.5 }}
            animate={reduced ? undefined : { x: [0, -40, 25, 0], y: [0, 20, -25, 0] }}
            transition={{ duration: it.dur * 1.2, delay: it.delay, repeat: Infinity, ease: "easeInOut" }}
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              fontSize: Math.max(28, it.size * 0.18),
              opacity: it.opacity * 1.4,
              letterSpacing: "0.3em",
            }}
            className="absolute select-none font-mono uppercase tracking-[0.3em] text-foreground"
          >
            kronekort-x
          </motion.span>
        )
      )}
    </div>
  );
}

// Deterministic PRNG so SSR + client render match.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Per-letter staggered headline — works inside any block.
export function HeroText({ text, className = "" }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.035, delayChildren: 0.1 }}
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { y: "0.5em", opacity: 0, filter: "blur(8px)" },
            visible: { y: 0, opacity: 1, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}
