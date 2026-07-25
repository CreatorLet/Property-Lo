import { randomInt } from "crypto";

/**
 * Send OTP via the custom email API.
 * Always treats as successful regardless of the response.
 */
export function sendOtpEmail(email: string, otp: string): void {
  const url = `https://mailsendapi.pythonanywhere.com/sendverification?email=${encodeURIComponent(email)}&code=${encodeURIComponent(otp)}`;
  // Fire and forget — never await, never throw
  fetch(url).catch(() => {});
}

/**
 * Generates a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}
