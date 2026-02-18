import { z } from 'zod';

// User roles
export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// Login request/response
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expiresAt: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Register request/response
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expiresAt: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// Current user response (for /auth/me endpoint)
export const MeResponseSchema = z.object({
  user: UserSchema,
});

export type MeResponse = z.infer<typeof MeResponseSchema>;

// Logout response
export const LogoutResponseSchema = z.object({
  success: z.boolean(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// Auth error response
export const AuthErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['INVALID_CREDENTIALS', 'USER_NOT_FOUND', 'USER_INACTIVE', 'SESSION_EXPIRED', 'UNAUTHORIZED']).optional(),
});

export type AuthError = z.infer<typeof AuthErrorSchema>;
