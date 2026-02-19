import { z } from 'zod';

// ============================================================================
// OTP Authentication
// ============================================================================

export const SendOtpRequestSchema = z.object({
  phone: z.string().min(9),
});
export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;

export const SendOtpResponseSchema = z.object({
  success: z.boolean(),
  phone: z.string(),
  devCode: z.string().optional(), // Only in development
});
export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;

export const VerifyOtpRequestSchema = z.object({
  phone: z.string().min(9),
  code: z.string().length(6),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

export const VerifyOtpResponseSchema = z.object({
  success: z.boolean(),
  isNewUser: z.boolean(),
  token: z.string(),
  expiresAt: z.string(),
  profile: z.any(), // ProfileSchema used at runtime
});
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
});
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export const AuthErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    'INVALID_OTP',
    'OTP_EXPIRED',
    'OTP_USED',
    'TOO_MANY_ATTEMPTS',
    'SESSION_EXPIRED',
    'UNAUTHORIZED',
    'FORBIDDEN',
  ]).optional(),
});
export type AuthError = z.infer<typeof AuthErrorSchema>;
