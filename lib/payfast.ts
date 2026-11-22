/**
 * Totus Massage & Aesthetics — PayFast Cryptographic Signature & Verification Module
 *
 * Implements:
 * - Exact PHP `urlencode()` parity required by PayFast Custom Integration
 * - Outbound checkout signature generation (`generatePayFastSignature`)
 * - Inbound ITN webhook signature verification (`verifyPayFastItnSignature`) using
 *   constant-time comparison (`crypto.timingSafeEqual`) preserving PayFast's POST parameter order
 * - Official server-to-server PayFast ITN validation helper (`confirmPayFastItnWithGateway`)
 */

import crypto from "crypto";

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number: string;
  m_payment_id: string; // Booking reference code
  amount: string; // e.g. "200.00"
  item_name: string;
  item_description?: string;
  custom_str1?: string; // Booking ID
  custom_str2?: string; // Payment choice: RETAINER_30 or FULL_100
  signature?: string;
}

/**
 * Accurately replicates PHP's urlencode() in Node.js for PayFast signature generation.
 * - Spaces become '+'
 * - '!', "'", '(', ')', '*' are percent-encoded uppercase (%21, %27, %28, %29, %2A)
 * - Hex sequences are uppercase (%3A, etc.)
 */
export function phpUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/%[0-9a-f]{2}/g, (match) => match.toUpperCase());
}

/**
 * Generates an outbound PayFast MD5 signature (keys sorted alphabetically, empty fields omitted).
 */
export function generatePayFastSignature(
  data: Record<string, string | undefined>,
  passphrase?: string
): string {
  const keys = Object.keys(data).filter(
    (key) =>
      key !== "signature" &&
      data[key] !== undefined &&
      data[key] !== null &&
      String(data[key]).trim() !== ""
  );

  keys.sort();

  let pfOutput = "";
  for (const key of keys) {
    const val = String(data[key]).trim();
    pfOutput += `${key}=${phpUrlEncode(val)}&`;
  }

  let getString = pfOutput.slice(0, -1);

  if (passphrase && passphrase.trim() !== "") {
    getString += `&passphrase=${phpUrlEncode(passphrase.trim())}`;
  }

  return crypto.createHash("md5").update(getString).digest("hex");
}

function constantTimeHexEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), "utf8");
  const bufB = Buffer.from(b.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies an incoming PayFast ITN webhook signature using constant-time comparison.
 * PayFast computes ITN signatures over the exact POST parameter order (excluding `signature`),
 * preserving field encoding and appending `&passphrase=...` if configured.
 */
export function verifyPayFastItnSignature(
  rawBody: string,
  receivedSignature: string | undefined,
  passphrase?: string
): boolean {
  if (!receivedSignature || !/^[a-f0-9]{32}$/i.test(receivedSignature.trim())) {
    return false;
  }

  const trimmedSig = receivedSignature.trim().toLowerCase();
  const cleanPassphrase = passphrase?.trim() || "";
  const passphraseSuffix = cleanPassphrase
    ? `&passphrase=${phpUrlEncode(cleanPassphrase)}`
    : "";

  // 1. Primary official ITN spec: exact POST order, re-encoded with PHP urlencode (including empty values)
  const params = new URLSearchParams(rawBody);
  const orderedParts: string[] = [];
  const orderedNonEmptyParts: string[] = [];

  params.forEach((value, key) => {
    if (key === "signature") return;
    const trimmedVal = value.trim();
    const encodedPair = `${key}=${phpUrlEncode(trimmedVal)}`;
    orderedParts.push(encodedPair);
    if (trimmedVal !== "") {
      orderedNonEmptyParts.push(encodedPair);
    }
  });

  const candidates = [
    orderedParts.join("&") + passphraseSuffix,
    orderedNonEmptyParts.join("&") + passphraseSuffix,
  ];

  // Also include raw-wire order stripped of signature param (matches PayFast PHP raw payload verbatim)
  const rawWithoutSig = rawBody
    .split("&")
    .filter((pair) => !pair.startsWith("signature="))
    .join("&");
  if (rawWithoutSig) {
    candidates.push(rawWithoutSig + passphraseSuffix);
  }

  for (const candidate of candidates) {
    const hash = crypto.createHash("md5").update(candidate).digest("hex");
    if (constantTimeHexEquals(hash, trimmedSig)) {
      return true;
    }
  }

  return false;
}

/**
 * Performs PayFast's official server-to-server ITN validation handshake (`POST /eng/query/validate`).
 * Returns true strictly when PayFast replies with `"VALID"`.
 */
export async function confirmPayFastItnWithGateway(rawBody: string): Promise<boolean> {
  try {
    const validateUrl = getPayFastValidateUrl();
    const res = await fetch(validateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: rawBody,
      cache: "no-store",
    });

    if (!res.ok) return false;
    const text = (await res.text()).trim().toUpperCase();
    return text === "VALID";
  } catch (err) {
    console.error("[PayFast ITN Validation Request Error]:", err);
    return false;
  }
}

export function getPayFastUrl(): string {
  const isSandbox = process.env.PAYFAST_SANDBOX !== "false";
  return isSandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

export function getPayFastValidateUrl(): string {
  const isSandbox = process.env.PAYFAST_SANDBOX !== "false";
  return isSandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
}
