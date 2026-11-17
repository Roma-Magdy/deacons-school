// Validation for the admin "shapes" screen. Plain .mjs so it can be unit-tested with `npm test`.

export const MAX_SHAPE_NAME = 30;
export const MAX_SHAPE_STARS = 100000;
/** Biggest uploaded picture, in bytes. The browser shrinks pictures to about 256 px first, so this is generous. */
export const MAX_IMAGE_BYTES = 300 * 1024;
export const MAX_IMAGE_SIDE = 512;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * @param {{ name: unknown, emoji: unknown, stars: unknown }} input
 * @returns {{ ok: true, value: { name: string, emoji: string | null, stars: number } } | { ok: false, error: "name" | "emoji" | "stars" }}
 */
export function validateShape({ name, emoji, stars }) {
  const cleanName = String(name ?? "").replace(/\s+/g, " ").trim();
  if (cleanName.length < 2 || cleanName.length > MAX_SHAPE_NAME) return { ok: false, error: "name" };

  const cleanEmoji = String(emoji ?? "").trim();
  // Empty is fine here (the shape may have a picture instead); the caller checks that one of the two exists.
  if (cleanEmoji && (cleanEmoji.length > 16 || !/\p{Extended_Pictographic}/u.test(cleanEmoji))) return { ok: false, error: "emoji" };

  const n = typeof stars === "string" ? (stars.trim() === "" ? NaN : Number(stars)) : Number(stars);
  if (!Number.isInteger(n) || n < 0 || n > MAX_SHAPE_STARS) return { ok: false, error: "stars" };

  return { ok: true, value: { name: cleanName, emoji: cleanEmoji || null, stars: n } };
}

/**
 * Checks that the bytes really are a small PNG. Only PNG is accepted (never SVG, which can carry scripts).
 * @param {Uint8Array} bytes
 * @returns {"ok" | "type" | "size"}
 */
export function checkPng(bytes) {
  if (bytes.length > MAX_IMAGE_BYTES) return "size";
  if (bytes.length < 33 || PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) return "type";
  // The first chunk must be IHDR, which holds the width and height.
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunk !== "IHDR") return "type";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width < 1 || height < 1 || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) return "size";
  return "ok";
}
