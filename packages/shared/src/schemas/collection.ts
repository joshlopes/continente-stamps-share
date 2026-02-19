import { z } from 'zod';

export const RedemptionOptionSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  stampsRequired: z.number().int(),
  feeEuros: z.number(),
  label: z.string().nullable(),
  sortOrder: z.number(),
});
export type RedemptionOption = z.infer<typeof RedemptionOptionSchema>;

export const CollectionItemSchema = z.object({
  id: z.string().uuid(),
  collectionId: z.string().uuid(),
  name: z.string(),
  subtitle: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isOutOfStock: z.boolean(),
  sortOrder: z.number(),
});
export type CollectionItem = z.infer<typeof CollectionItemSchema>;

export const CollectionItemWithOptionsSchema = CollectionItemSchema.extend({
  options: z.array(RedemptionOptionSchema),
});
export type CollectionItemWithOptions = z.infer<typeof CollectionItemWithOptionsSchema>;

export const StampCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number(),
});
export type StampCollection = z.infer<typeof StampCollectionSchema>;

export const StampCollectionWithItemsSchema = StampCollectionSchema.extend({
  items: z.array(CollectionItemWithOptionsSchema),
});
export type StampCollectionWithItems = z.infer<typeof StampCollectionWithItemsSchema>;

export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});
export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;

export const CreateCollectionItemRequestSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().optional(),
});
export type CreateCollectionItemRequest = z.infer<typeof CreateCollectionItemRequestSchema>;

export const CreateRedemptionOptionRequestSchema = z.object({
  stampsRequired: z.number().int().min(0),
  feeEuros: z.number().min(0).optional(),
  label: z.string().optional(),
  sortOrder: z.number().optional(),
});
export type CreateRedemptionOptionRequest = z.infer<typeof CreateRedemptionOptionRequestSchema>;
