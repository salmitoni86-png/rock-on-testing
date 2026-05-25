import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT_BASE = `You are Kronekort-X's AI support bot. Keep answers short and helpful.
App features you know: automatic balance polling for DNB Kronekort 6x/day, sharing with family via username, push/SMS/email/WhatsApp/Discord/Telegram alerts, VIP/SoS membership (€5/mo) with loan offers (1x-3x rating + custom), transaction history with print export, blog, referral/invite system with tier rewards.
If the user asks for a human or you can't help — set human_handoff=true in the tool call.
Be friendly, concise, max 3 sentences per reply.`;

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId?: string; anonId: string; body: string; lang?: string }) =>
    z.object({
      conversationId: z.string().uuid().optional(),
      anonId: z.string().min(1).max(80),
      body: z.string().min(1).max(2000),
      lang: z.string().min(1).max(40).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\nReply in this language: ${data.lang ?? "Norsk"}. Match the user's language if they switch.`;
    // 1. Find or create conversation
    let convId = data.conversationId;
    if (!convId) {
      const { data: conv, error } = await supabaseAdmin
        .from("support_conversations")
        .insert({ anon_id: data.anonId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      convId = conv.id;
    }

    // 2. Persist user message
    await supabaseAdmin.from("support_messages").insert({ conversation_id: convId, role: "user", body: data.body });

    // 3. Pull history
    const { data: history } = await supabaseAdmin
      .from("support_messages")
      .select("role,body")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).map((m) => ({
        role: m.role === "staff" ? "assistant" : m.role,
        content: m.body,
      })),
    ];

    // 4. Call Lovable AI
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "respond",
              description: "Respond to the user, optionally flagging a human handoff",
              parameters: {
                type: "object",
                properties: {
                  reply: { type: "string" },
                  human_handoff: { type: "boolean" },
                },
                required: ["reply", "human_handoff"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "respond" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("ai gateway error", aiRes.status, txt);
      const fallback = "Beklager, jeg har litt trøbbel akkurat nå. Skriv 'menneske' om du vil at en person tar over.";
      await supabaseAdmin.from("support_messages").insert({ conversation_id: convId, role: "assistant", body: fallback });
      return { conversationId: convId, reply: fallback, needsHuman: false };
    }

    const json = await aiRes.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    let reply = "Beklager, jeg fikk ikke til å svare nå.";
    let needsHuman = false;
    try {
      const args = JSON.parse(call?.function?.arguments ?? "{}");
      reply = args.reply ?? reply;
      needsHuman = !!args.human_handoff;
    } catch {}

    await supabaseAdmin.from("support_messages").insert({ conversation_id: convId, role: "assistant", body: reply });
    if (needsHuman) {
      await supabaseAdmin.from("support_conversations").update({ needs_human: true }).eq("id", convId);
    }

    return { conversationId: convId, reply, needsHuman };
  });
