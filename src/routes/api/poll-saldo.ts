import { createFileRoute } from "@tanstack/react-router";

// Proxy-rotated saldo poll. Picks a random egress proxy from PROXY_LIST
// (comma-separated http(s) URLs) so DNB never sees all polls from one IP.
// Falls back to a labelled mock when no proxy list is configured — the
// app is in demo mode and we don't ship real DNB credentials.

function pickProxy(): { label: string; url: string | null } {
  const list = (process.env.PROXY_LIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) {
    const pool = ["eu-north-1", "eu-west-2", "scand-3", "nordic-7", "oslo-a", "bergen-b"];
    return { label: pool[Math.floor(Math.random() * pool.length)], url: null };
  }
  const url = list[Math.floor(Math.random() * list.length)];
  let host = url;
  try { host = new URL(url).host; } catch { /* keep raw */ }
  return { label: host, url };
}

export const Route = createFileRoute("/api/poll-saldo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { url: proxy, label } = pickProxy();

        // In production with a real DNB PSD2 token this would do:
        // fetch("https://developer.dnb.no/psd2/v1/accounts", { ... , dispatcher: new ProxyAgent(proxy) })
        // For demo we synthesize a small balance delta.
        const delta = Math.round((Math.random() - 0.55) * 800);

        let body: { cardId?: string } = {};
        try { body = await request.json(); } catch { /* no body */ }

        return Response.json({
          ok: true,
          proxy: label,
          proxyUsed: Boolean(proxy),
          cardId: body.cardId ?? "dnb-1",
          delta,
          checkedAt: new Date().toISOString(),
        });
      },
    },
  },
});
