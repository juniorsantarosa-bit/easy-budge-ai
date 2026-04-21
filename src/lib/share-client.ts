import { supabase } from "@/integrations/supabase/client";
import { type BudgetModel, uid } from "./storage";
import { decodeShare, type SharePayload } from "./share";

const SHARE_BUCKET = "orcafacil";
const SHARE_PREFIX = "shares";
const PUBLISHED_SHARE_ORIGIN = "https://easy-budge-ai.lovable.app";

export function getShareOrigin() {
  if (typeof window === "undefined") return PUBLISHED_SHARE_ORIGIN;

  return window.location.hostname.includes("id-preview--")
    ? PUBLISHED_SHARE_ORIGIN
    : window.location.origin;
}

export function buildPublicShareUrl(token: string) {
  return `${getShareOrigin()}/share/${token}`;
}

export async function createShareSnapshot(model: BudgetModel, values: Record<string, string>) {
  const token = `s_${uid()}`;
  const path = `${SHARE_PREFIX}/${token}.json`;
  const payload: SharePayload = { v: 1, model, values };

  const { error } = await supabase.storage.from(SHARE_BUCKET).upload(path, new Blob([JSON.stringify(payload)], {
    type: "application/json",
  }), {
    cacheControl: "31536000",
    contentType: "application/json",
    upsert: true,
  });

  if (error) throw error;
  return token;
}

export async function resolveSharedBudget(token: string) {
  const inlinePayload = decodeShare(token);
  if (inlinePayload) return inlinePayload;

  if (!token.startsWith("s_")) return null;

  const { data } = supabase.storage.from(SHARE_BUCKET).getPublicUrl(`${SHARE_PREFIX}/${token}.json`);
  const response = await fetch(data.publicUrl, { cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json()) as SharePayload;
  if (!payload?.model || payload.v !== 1) return null;

  return payload;
}