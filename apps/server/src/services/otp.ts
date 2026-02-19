import type { PrismaClient } from '../../generated/prisma/client.js';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

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
 * Generate a random 6-digit OTP code.
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP: invalidate previous codes for this phone, create new one.
 * Returns the phone and code (in production, code would be sent via SMS).
 */
export async function sendOtp(
  prisma: PrismaClient,
  phone: string,
): Promise<{ phone: string; code: string }> {
  const normalizedPhone = normalizePhone(phone);
  const code = generateOtp();
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

  // Create new OTP
  await prisma.otpCode.create({
    data: {
      phone: normalizedPhone,
      code,
      expiresAt,
    },
  });

  // In production, send SMS here
  // await smsService.send(normalizedPhone, `Your SeloTroca code is: ${code}`);

  return { phone: normalizedPhone, code };
}

/**
 * Verify OTP code for a phone number.
 * Finds matching unused non-expired OTP, increments attempts, marks as used on success.
 */
export async function verifyOtp(
  prisma: PrismaClient,
  phone: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = normalizePhone(phone);

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

  // Check max attempts
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
    return { success: false, error: 'TOO_MANY_ATTEMPTS' };
  }

  // Increment attempts
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } },
  });

  // Check code match
  if (otpRecord.code !== code) {
    return { success: false, error: 'INVALID_OTP' };
  }

  // Mark as used
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return { success: true };
}
