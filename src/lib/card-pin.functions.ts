import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// App-level PIN lock for a card. We NEVER store the real digits — only a
// salted scrypt hash (format: "salt:hash"). This protects opening a card's
// details inside the app; it is not the bank card PIN.

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(pin, salt, 32);
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}

const pinSchema = z.object({
  cardId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4-8 digits"),
});

// Owner sets / changes the PIN. RLS restricts UPDATE to the owner.
export const setCardPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pinSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("cards")
      .update({ pin_hash: hashPin(data.pin) })
      .eq("id", data.cardId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Owner removes the PIN.
export const clearCardPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ cardId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("cards")
      .update({ pin_hash: null })
      .eq("id", data.cardId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Any card member verifies the PIN to unlock the view.
export const verifyCardPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pinSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: card, error } = await supabase
      .from("cards")
      .select("pin_hash")
      .eq("id", data.cardId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!card) return { ok: false, locked: false };
    if (!card.pin_hash) return { ok: true, locked: false };
    return { ok: verifyPin(data.pin, card.pin_hash), locked: true };
  });
