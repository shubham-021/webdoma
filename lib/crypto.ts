/**
 *
 * AES-256-GCM encryption/decryption for TorBox WebDAV passwords stored at rest.
 *
 * Key derivation: The SESSION_SECRET (arbitrary length) is hashed with SHA-256
 * to produce a fixed 32-byte AES key - no separate secret is needed.
 *
 * Wire format (all hex, colon-separated): "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  // Produce a deterministic 32-byte key from the secret
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-delimited hex string: "<iv>:<authTag>:<ciphertext>"
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}



/**
 * Decrypts a ciphertext produced by `encrypt`.
 * Throws if the data is tampered with or the key is wrong.
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const [ivHex, tagHex, ctHex] = parts;
  const key = deriveKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const ct = Buffer.from(ctHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// ── HMAC play tokens (daemon → server auth) ───────────────────────────────────
// Format: "<base64url(payload)>.<hex(hmac-sha256)>" where payload is
// { userId, accountId, torrentId, fileId, exp }.

export function mintPlayToken(payload: {
  userId: number;
  accountId: number;
  torrentId: number;
  fileId: number;
}): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${sig}`;
}

export function verifyPlayToken(token: string): {
  userId: number;
  accountId: number;
  torrentId: number;
  fileId: number;
} | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = createHmac("sha256", secret).update(data).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (
      typeof parsed.exp !== "number" ||
      parsed.exp <= Math.floor(Date.now() / 1000) ||
      typeof parsed.userId !== "number" ||
      typeof parsed.accountId !== "number" ||
      typeof parsed.torrentId !== "number" ||
      typeof parsed.fileId !== "number"
    ) {
      return null;
    }
    return {
      userId: parsed.userId,
      accountId: parsed.accountId,
      torrentId: parsed.torrentId,
      fileId: parsed.fileId,
    };
  } catch {
    return null;
  }
}
