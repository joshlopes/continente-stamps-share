-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('offer', 'request');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('pending_validation', 'active', 'fulfilled', 'cancelled', 'expired', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('offer', 'request', 'exchange');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "display_name" TEXT,
    "email" TEXT NOT NULL DEFAULT '',
    "date_of_birth" DATE,
    "district" TEXT NOT NULL DEFAULT '',
    "registration_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "stamp_balance" INTEGER NOT NULL DEFAULT 0,
    "weekly_stamps_requested" INTEGER NOT NULL DEFAULT 0,
    "weekly_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_offered" INTEGER NOT NULL DEFAULT 0,
    "total_requested" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamp_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "collection" TEXT,
    "notes" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "fulfilled_by" TEXT,
    "fulfilled_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stamp_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamp_transactions" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "to_user_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "listing_id" TEXT,
    "points_from" INTEGER NOT NULL DEFAULT 0,
    "points_to" INTEGER NOT NULL DEFAULT 0,
    "type" "TransactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stamp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamp_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "starts_at" DATE NOT NULL,
    "ends_at" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stamp_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT,
    "is_out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_options" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "stamps_required" INTEGER NOT NULL,
    "fee_euros" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "admin_device_phone" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phone_key" ON "profiles"("phone");

-- CreateIndex
CREATE INDEX "profiles_phone_idx" ON "profiles"("phone");

-- CreateIndex
CREATE INDEX "profiles_points_idx" ON "profiles"("points");

-- CreateIndex
CREATE INDEX "profiles_level_idx" ON "profiles"("level");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");

-- CreateIndex
CREATE INDEX "otp_codes_phone_code_used_idx" ON "otp_codes"("phone", "code", "used");

-- CreateIndex
CREATE INDEX "stamp_listings_user_id_status_type_idx" ON "stamp_listings"("user_id", "status", "type");

-- CreateIndex
CREATE INDEX "stamp_listings_status_type_idx" ON "stamp_listings"("status", "type");

-- CreateIndex
CREATE INDEX "stamp_listings_expires_at_idx" ON "stamp_listings"("expires_at");

-- CreateIndex
CREATE INDEX "stamp_transactions_from_user_id_idx" ON "stamp_transactions"("from_user_id");

-- CreateIndex
CREATE INDEX "stamp_transactions_to_user_id_idx" ON "stamp_transactions"("to_user_id");

-- CreateIndex
CREATE INDEX "stamp_transactions_listing_id_idx" ON "stamp_transactions"("listing_id");

-- CreateIndex
CREATE INDEX "stamp_collections_is_active_ends_at_idx" ON "stamp_collections"("is_active", "ends_at");

-- CreateIndex
CREATE INDEX "collection_items_collection_id_sort_order_idx" ON "collection_items"("collection_id", "sort_order");

-- CreateIndex
CREATE INDEX "redemption_options_item_id_sort_order_idx" ON "redemption_options"("item_id", "sort_order");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_listings" ADD CONSTRAINT "stamp_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_listings" ADD CONSTRAINT "stamp_listings_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_transactions" ADD CONSTRAINT "stamp_transactions_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_transactions" ADD CONSTRAINT "stamp_transactions_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_transactions" ADD CONSTRAINT "stamp_transactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "stamp_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_collections" ADD CONSTRAINT "stamp_collections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "stamp_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption_options" ADD CONSTRAINT "redemption_options_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "collection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
