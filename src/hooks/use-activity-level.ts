import { useEffect, useState } from "react";

/**
 * Tracks how "active" the user currently is based on mouse movement,
 * keyboard input, scrolling and touch. Returns a value in [0, 1] that
 * rises smoothly toward 1 while the user interacts and decays toward 0
 * during inactivity (no mouse / no keyboard / no scroll / no touch).
 *
 * The decay is time-based and frame-driven so the transition stays
 * buttery-smooth regardless of refresh rate.
 */
export function useActivityLevel({
  idleMs = 4000,
  attack = 0.18,
}: { idleMs?: number; attack?: number } = {}) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let target = 0; // 1 right after activity, eased back to 0 while idle
    let current = 0;
    let lastActivity = performance.now();
    let raf = 0;

    const bump = () => {
      lastActivity = performance.now();
      target = 1;
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "wheel",
      "scroll",
      "touchstart",
      "touchmove",
      "pointermove",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const loop = () => {
      const now = performance.now();
      const idleFor = now - lastActivity;

      // After the idle window, ease the target down based on how long idle.
      if (idleFor > idleMs) {
        const over = Math.min(1, (idleFor - idleMs) / idleMs);
        target = 1 - over;
      }

      // Smoothly approach the target (attack while rising, slower release).
      const rate = target > current ? attack : attack * 0.4;
      current += (target - current) * rate;

      // Snap tiny residuals so it can fully settle.
      if (Math.abs(target - current) < 0.001) current = target;

      setLevel((prev) => (Math.abs(prev - current) > 0.002 ? current : prev));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [idleMs, attack]);

  return level;
}
