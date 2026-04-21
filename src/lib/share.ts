import type { BudgetModel } from "./storage";

export interface SharePayload {
  model: BudgetModel;
  values: Record<string, string>;
  v: 1;
}

// Base64 URL-safe encoding de UTF-8
function utf8ToB64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToUtf8(b64: string): string {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const std = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(std);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(payload: SharePayload): string {
  return utf8ToB64Url(JSON.stringify(payload));
}

export function decodeShare(token: string): SharePayload | null {
  try {
    const json = b64UrlToUtf8(token);
    const obj = JSON.parse(json);
    if (!obj || obj.v !== 1 || !obj.model) return null;
    return obj as SharePayload;
  } catch {
    return null;
  }
}
