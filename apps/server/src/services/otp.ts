import type { PrismaClient } from '../../generated/prisma/client.js';
import { sendOtpVerification, checkOtpVerification } from './sms.js';

const OTP_EXPIRY_MINUTES = 10;

/**
 * Normalize Portuguese phone numbers.
 * Handles +351, 351, and 9xx formats. Returns 351XXXXXXXXX.
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle various formats
  if (digits.startsWith('00351')) {
    digits = digits.slice(2); // Remove 00 prefix
  } else if (digits.startsWith('+351') || phone.startsWith('+351')) {
    // Already handled by replacing non-digits, but guard
    digits = digits.startsWith('351') ? digits : '351' + digits;
  }

  // If starts with 9 and is 9 digits, it's a local number
  if (digits.length === 9 && digits.startsWith('9')) {
    return '351' + digits;
  }

  // If already has country code
  if (digits.startsWith('351') && digits.length === 12) {
    return digits;
  }

  // Fallback: return as-is (will fail validation at higher level if needed)
  return digits;
}

/**
 * Generate a random 6-digit OTP code (used for mock/fallback only).
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP via Twilio Verify.
 * Creates a tracking record in the database and sends verification via Twilio.
 */
export async function sendOtp(
  prisma: PrismaClient,
  phone: string,
): Promise<{ phone: string; code: string }> {
  const normalizedPhone = normalizePhone(phone);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate all previous unused OTPs for this phone
  await prisma.otpCode.updateMany({
    where: {
      phone: normalizedPhone,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Create tracking record (code is placeholder - Twilio generates the real one)
  // We use "TWILIO" as code to indicate it's handled by Twilio Verify
  await prisma.otpCode.create({
    data: {
      phone: normalizedPhone,
      code: 'TWILIO_VERIFY',
      expiresAt,
    },
  });

  // Send verification via Twilio Verify
  const verifyResult = await sendOtpVerification(normalizedPhone);
  if (!verifyResult.success) {
    console.error(`[OTP] Failed to send verification to ${normalizedPhone}:`, verifyResult.error);
    // Don't throw - in mock mode, code "123456" will work
  }

  // Return placeholder code - in production, user receives code via SMS from Twilio
  // In mock mode, use "123456"
  return { phone: normalizedPhone, code: '******' };
}

/**
 * Verify OTP code via Twilio Verify.
 * Twilio handles rate limiting, expiry, and code validation.
 */
export async function verifyOtp(
  prisma: PrismaClient,
  phone: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = normalizePhone(phone);

  // Check if there's a pending verification record
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone: normalizedPhone,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return { success: false, error: 'OTP_EXPIRED' };
  }

  // Verify code via Twilio Verify
  const verifyResult = await checkOtpVerification(normalizedPhone, code);

  if (!verifyResult.success) {
    // Increment attempts for tracking
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    return { success: false, error: verifyResult.error || 'INVALID_OTP' };
  }

  // Mark as used on success
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return { success: true };
}
