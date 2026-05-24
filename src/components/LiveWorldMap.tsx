import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SERVER_LOC } from "@/lib/visit-tracker";

type Visit = { id: number; lat: number; lng: number; city: string | null; country: string | null; created_at: string };

// Equirectangular projection — simple but fine for a global overview.
const W = 1000;
const H = 500;
function project(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

const SERVER = project(SERVER_LOC.lat, SERVER_LOC.lng);

export function LiveWorldMap() {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("site_visits")
        .select("id,lat,lng,city,country,created_at")
        .gt("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(80);
      if (!cancelled && data) setVisits(data as Visit[]);
    }
    load();
    const ch = supabase
      .channel("site_visits_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_visits" }, (p) => {
        const r = p.new as Visit;
        if (r.lat != null && r.lng != null) setVisits((v) => [r, ...v].slice(0, 80));
      })
      .subscribe();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-background to-card p-4">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--income)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--income)]" />
        </span>
        {visits.length} aktive de siste 15 min
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <radialGradient id="dot" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--bcard-c)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dot-grid "world" — minimalist, no library */}
        {Array.from({ length: 40 }).flatMap((_, ry) =>
          Array.from({ length: 80 }).map((__, rx) => {
            const x = (rx + 0.5) * (W / 80);
            const y = (ry + 0.5) * (H / 40);
            return <circle key={`${rx}-${ry}`} cx={x} cy={y} r="1.2" fill="currentColor" className="text-foreground/10" />;
          })
        )}

        {/* Arcs from server -> each visit */}
        {visits.map((v) => {
          const p = project(v.lat, v.lng);
          const midX = (SERVER.x + p.x) / 2;
          const midY = Math.min(SERVER.y, p.y) - Math.abs(SERVER.x - p.x) * 0.25;
          const d = `M ${SERVER.x} ${SERVER.y} Q ${midX} ${midY} ${p.x} ${p.y}`;
          return (
            <g key={v.id}>
              <motion.path
                d={d}
                fill="none"
                stroke="url(#arc)"
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.4] }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />
              <circle cx={p.x} cy={p.y} r="10" fill="url(#dot)" />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="var(--primary)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              />
            </g>
          );
        })}

        {/* Server pulse */}
        <motion.circle
          cx={SERVER.x}
          cy={SERVER.y}
          r="6"
          fill="var(--bcard-c)"
          animate={{ scale: [1, 1.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx={SERVER.x} cy={SERVER.y} r="3" fill="white" />
      </svg>
    </div>
  );
}
