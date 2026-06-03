import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Number of warnings before a user is banned.
const BAN_THRESHOLD = 3;

type ModerationResult = { abusive: boolean; reason: string };

/**
 * Ask Lovable AI to classify whether a piece of user content is spam / abusive.
 * Fails open (treats as clean) if the AI is unavailable, so legit posts are
 * never blocked by an outage.
 */
async function moderate(text: string): Promise<ModerationResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { abusive: false, reason: "" };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a strict content moderator for an earning-tips community. Flag content that is spam, scams, phishing, hate speech, harassment, sexual content, or clearly abusive. Normal earning links, referral links and friendly discussion are NOT abusive. Respond via the tool only.",
          },
          { role: "user", content: text.slice(0, 4000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify",
              description: "Classify the content",
              parameters: {
                type: "object",
                properties: {
                  abusive: { type: "boolean" },
                  reason: { type: "string", description: "Short reason if abusive, else empty" },
                },
                required: ["abusive", "reason"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify" } },
      }),
    });
    if (!res.ok) return { abusive: false, reason: "" };
    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = JSON.parse(call?.function?.arguments ?? "{}");
    return { abusive: !!args.abusive, reason: String(args.reason ?? "") };
  } catch {
    return { abusive: false, reason: "" };
  }
}

/** Record a warning, escalate to ban at the threshold. Returns the new state. */
async function strike(userId: string, reason: string, context: string) {
  await supabaseAdmin
    .from("user_warnings")
    .insert({ user_id: userId, reason, severity: "warning", context: context.slice(0, 500) });

  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("warning_count")
    .eq("id", userId)
    .single();

  const newCount = (prof?.warning_count ?? 0) + 1;
  const banned = newCount >= BAN_THRESHOLD;

  await supabaseAdmin
    .from("profiles")
    .update({
      warning_count: newCount,
      banned,
      banned_at: banned ? new Date().toISOString() : null,
      ban_reason: banned ? reason : null,
    })
    .eq("id", userId);

  if (banned) {
    await supabaseAdmin
      .from("user_warnings")
      .insert({ user_id: userId, reason, severity: "ban", context: "Auto-ban: warning threshold reached" });
  }

  return { warningCount: newCount, banned, threshold: BAN_THRESHOLD };
}

async function assertNotBanned(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("banned")
    .eq("id", userId)
    .single();
  if (data?.banned) {
    throw new Error("BANNED");
  }
}

const tipSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(1500),
  url: z.string().trim().url().max(500),
  hashtag: z.string().trim().max(40).optional(),
  krAmount: z.number().min(0).max(1_000_000),
  minWithdraw: z.number().min(0).max(1_000_000),
  withdrawMultiplier: z.number().min(1).max(100),
});

export const submitTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => tipSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertNotBanned(userId);

    const verdict = await moderate(`${data.title}\n${data.description}\n${data.url}`);
    if (verdict.abusive) {
      const state = await strike(userId, verdict.reason || "Spam/misbruk oppdaget", data.title);
      return { ok: false as const, ...state, reason: verdict.reason };
    }

    const { data: row, error } = await supabase
      .from("earning_tips")
      .insert({
        author_id: userId,
        title: data.title,
        description: data.description,
        url: data.url,
        hashtag: data.hashtag?.replace(/^#/, "") || null,
        kr_amount: data.krAmount,
        min_withdraw: data.minWithdraw,
        withdraw_multiplier: data.withdrawMultiplier,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: row.id };
  });

export const submitTipComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ tipId: z.string().uuid(), body: z.string().trim().min(1).max(800) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertNotBanned(userId);

    const verdict = await moderate(data.body);
    if (verdict.abusive) {
      const state = await strike(userId, verdict.reason || "Spam/misbruk oppdaget", data.body);
      return { ok: false as const, ...state, reason: verdict.reason };
    }

    const { error } = await supabase
      .from("earning_tip_comments")
      .insert({ tip_id: data.tipId, author_id: userId, body: data.body });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Lightweight self-check used by the UI to show a ban banner. */
export const getMyModerationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("warning_count, banned, ban_reason")
      .eq("id", userId)
      .single();
    return {
      warningCount: data?.warning_count ?? 0,
      banned: !!data?.banned,
      banReason: data?.ban_reason ?? null,
      threshold: BAN_THRESHOLD,
    };
  });
