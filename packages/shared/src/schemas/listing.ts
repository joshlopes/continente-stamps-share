import { z } from 'zod';
import { ProfileSummarySchema } from './profile.js';

export const ListingTypeSchema = z.enum(['offer', 'request']);
export type ListingType = z.infer<typeof ListingTypeSchema>;

export const ListingStatusSchema = z.enum([
  'pending_send',
  'pending_validation',
  'active',
  'fulfilled',
  'cancelled',
  'expired',
  'rejected',
]);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

export const StampListingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: ListingTypeSchema,
  quantity: z.number().int().positive(),
  collection: z.string().nullable(),
  notes: z.string().nullable(),
  status: ListingStatusSchema,
  fulfilledBy: z.string().uuid().nullable(),
  fulfilledAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  validatedBy: z.string().uuid().nullable(),
  validatedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StampListing = z.infer<typeof StampListingSchema>;

export const StampListingWithProfileSchema = StampListingSchema.extend({
  user: ProfileSummarySchema,
});
export type StampListingWithProfile = z.infer<typeof StampListingWithProfileSchema>;

export const CreateListingRequestSchema = z.object({
  type: ListingTypeSchema,
  quantity: z.number().int().positive(),
  collection: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateListingRequest = z.infer<typeof CreateListingRequestSchema>;

export const RejectOfferRequestSchema = z.object({
  reason: z.string().optional(),
});
export type RejectOfferRequest = z.infer<typeof RejectOfferRequestSchema>;
