-- Migration: Remove database enums and use plain strings
-- Enums will be validated at the application level using Zod schemas

-- Convert ListingType enum column to text
ALTER TABLE "stamp_listings"
  ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

-- Convert ListingStatus enum column to text
-- First drop the default, then change type, then set new default
ALTER TABLE "stamp_listings"
  ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "stamp_listings"
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "stamp_listings"
  ALTER COLUMN "status" SET DEFAULT 'active';

-- Convert TransactionType enum column to text
ALTER TABLE "stamp_transactions"
  ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

-- Drop the enum types
DROP TYPE IF EXISTS "ListingType";
DROP TYPE IF EXISTS "ListingStatus";
DROP TYPE IF EXISTS "TransactionType";

