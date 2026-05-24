import { supabase } from "@/integrations/supabase/client";

// Simple anonymous visit tracker with random plausible coords for the live map.
// "Real visits, simulated map" — we record real sessions but assign plausible
// locations on insert so the live map has something to draw.

const SAMPLE_LOCATIONS: Array<{ country: string; city: string; lat: number; lng: number }> = [
  { country: "NO", city: "Oslo", lat: 59.91, lng: 10.75 },
  { country: "NO", city: "Bergen", lat: 60.39, lng: 5.32 },
  { country: "NO", city: "Trondheim", lat: 63.43, lng: 10.39 },
  { country: "SE", city: "Stockholm", lat: 59.33, lng: 18.07 },
  { country: "DK", city: "København", lat: 55.68, lng: 12.57 },
  { country: "DE", city: "Berlin", lat: 52.52, lng: 13.41 },
  { country: "GB", city: "London", lat: 51.51, lng: -0.13 },
  { country: "NL", city: "Amsterdam", lat: 52.37, lng: 4.9 },
  { country: "ES", city: "Madrid", lat: 40.42, lng: -3.7 },
  { country: "US", city: "New York", lat: 40.71, lng: -74.0 },
  { country: "US", city: "San Francisco", lat: 37.77, lng: -122.42 },
  { country: "JP", city: "Tokyo", lat: 35.68, lng: 139.69 },
  { country: "AU", city: "Sydney", lat: -33.87, lng: 151.21 },
  { country: "BR", city: "São Paulo", lat: -23.55, lng: -46.63 },
];

export const SERVER_LOC = { country: "NO", city: "Oslo", lat: 59.91, lng: 10.75 };

let tracked = false;
export async function trackVisit(path: string) {
  if (tracked || typeof window === "undefined") return;
  tracked = true;
  try {
    let sessionId = sessionStorage.getItem("kkx_sid");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("kkx_sid", sessionId);
    }
    const loc = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
    await supabase.from("site_visits").insert({
      session_id: sessionId,
      path,
      country: loc.country,
      city: loc.city,
      lat: loc.lat,
      lng: loc.lng,
      user_agent: navigator.userAgent.slice(0, 200),
    });
  } catch (e) {
    console.warn("visit track failed", e);
  }
}
