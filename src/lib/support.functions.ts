import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT = `Du er Kronekort-X sin AI-supportbot. Svar kort og hjelpsomt på norsk.
App-funksjoner du kjenner: automatisk saldo for DNB Kronekort 6× om dagen, deling med familie via brukernavn, push/SMS/e-post varsler, VIP/SoS-medlemskap (5€/mnd) med lånetilbud, transaksjonshistorikk med utskrift, blogg, og henvisningssystem.
Hvis brukeren ber om å snakke med et menneske eller du ikke kan hjelpe — sett human_handoff=true i tool-kallet.
Vær vennlig, kort, og bruk maks 3 setninger per svar.`;

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId?: string; anonId: string; body: string }) =>
    z.object({
      conversationId: z.string().uuid().optional(),
      anonId: z.string().min(1).max(80),
      body: z.string().min(1).max(2000),
    }).parse(d)
  )
  .handler(async ({ data }) => {
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
      { role: "system", content: SYSTEM_PROMPT },
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
