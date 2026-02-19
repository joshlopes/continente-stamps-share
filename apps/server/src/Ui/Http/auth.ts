import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { SendOtpRequestSchema, VerifyOtpRequestSchema } from '@stamps-share/shared';
import { normalizePhone, sendOtp, verifyOtp } from '../../services/otp.js';
import { createSession, deleteSession } from '../../services/auth.js';
import { authMiddleware } from './middleware.js';

function serializeProfile(profile: Record<string, unknown>) {
  return {
    ...profile,
    dateOfBirth: profile.dateOfBirth
      ? (profile.dateOfBirth as Date).toISOString().split('T')[0]
      : null,
    weeklyResetAt: (profile.weeklyResetAt as Date).toISOString(),
    createdAt: (profile.createdAt as Date).toISOString(),
    updatedAt: (profile.updatedAt as Date).toISOString(),
  };
}

export function authRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  /**
   * POST /send-otp
   * Send an OTP code to a phone number.
   */
  app.post('/send-otp', async (c) => {
    const body = await c.req.json();
    const parsed = SendOtpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid phone number', code: 'INVALID_OTP' }, 400);
    }

    try {
      const result = await sendOtp(prisma, parsed.data.phone);

      const response: Record<string, unknown> = {
        success: true,
        phone: result.phone,
      };

      // In development, include the code for testing
      if (process.env.NODE_ENV !== 'production') {
        response.devCode = result.code;
      }

      return c.json(response);
    } catch (error) {
      console.error('Error sending OTP:', error);
      return c.json({ error: 'Failed to send OTP' }, 500);
    }
  });

  /**
   * POST /verify-otp
   * Verify an OTP code and create/find profile + session.
   */
  app.post('/verify-otp', async (c) => {
    const body = await c.req.json();
    const parsed = VerifyOtpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'INVALID_OTP' }, 400);
    }

    try {
      const otpResult = await verifyOtp(prisma, parsed.data.phone, parsed.data.code);

      if (!otpResult.success) {
        return c.json(
          { error: otpResult.error ?? 'Invalid OTP', code: otpResult.error ?? 'INVALID_OTP' },
          401,
        );
      }

      const normalizedPhone = normalizePhone(parsed.data.phone);

      // Find or create profile
      let profile = await prisma.profile.findUnique({
        where: { phone: normalizedPhone },
      });

      const isNewUser = !profile;

      if (!profile) {
        // Reset weekly at next Monday
        const now = new Date();
        const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);

        profile = await prisma.profile.create({
          data: {
            phone: normalizedPhone,
            weeklyResetAt: nextMonday,
          },
        });
      }

      // Create session
      const session = await createSession(
        prisma,
        profile.id,
        c.req.header('user-agent'),
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || undefined,
      );

      return c.json({
        success: true,
        isNewUser,
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        profile: serializeProfile(profile as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return c.json({ error: 'Verification failed' }, 500);
    }
  });

  /**
   * GET /me
   * Get the current authenticated user's profile.
   */
  app.get('/me', authMiddleware(prisma), async (c) => {
    const profile = c.get('profile');
    return c.json({
      profile: serializeProfile(profile as unknown as Record<string, unknown>),
    });
  });

  /**
   * POST /logout
   * Delete the current session.
   */
  app.post('/logout', authMiddleware(prisma), async (c) => {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        await deleteSession(prisma, token);
      } catch {
        // Ignore - session might already be deleted
      }
    }
    return c.json({ success: true });
  });

  return app;
}
