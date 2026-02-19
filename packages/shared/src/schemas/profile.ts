import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  displayName: z.string().nullable(),
  email: z.string(),
  dateOfBirth: z.string().nullable(),
  district: z.string(),
  registrationComplete: z.boolean(),
  isAdmin: z.boolean(),
  points: z.number(),
  level: z.number(),
  tier: z.number(),
  stampBalance: z.number(),
  weeklyStampsRequested: z.number(),
  weeklyResetAt: z.string(),
  totalOffered: z.number(),
  totalRequested: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileSummarySchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  level: z.number(),
  tier: z.number(),
  points: z.number(),
});
export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  district: z.string().optional(),
  registrationComplete: z.boolean().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const MeResponseSchema = z.object({
  profile: ProfileSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
