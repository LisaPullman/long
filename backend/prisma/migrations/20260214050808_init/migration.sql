-- CreateEnum
CREATE TYPE "MartStatus" AS ENUM ('OPEN', 'CLOSED', 'ENDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PENDING_SHIPMENT', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "nickname" VARCHAR(100),
    "avatar_url" TEXT,
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "real_name" VARCHAR(50),
    "id_card" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_info" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "receiver_name" VARCHAR(50) NOT NULL,
    "receiver_phone" VARCHAR(20) NOT NULL,
    "province" VARCHAR(50) NOT NULL,
    "province_code" VARCHAR(10),
    "city" VARCHAR(50) NOT NULL,
    "city_code" VARCHAR(10),
    "district" VARCHAR(50) NOT NULL,
    "district_code" VARCHAR(10),
    "detail_address" VARCHAR(500) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "tag" VARCHAR(20),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "topic" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "set_finish_time" BOOLEAN NOT NULL DEFAULT false,
    "finish_time" TIMESTAMP(3),
    "status" "MartStatus" NOT NULL DEFAULT 'OPEN',
    "browse_count" INTEGER NOT NULL DEFAULT 0,
    "is_single_product" BOOLEAN NOT NULL DEFAULT false,
    "group_sum" INTEGER,
    "delivery_description" TEXT,
    "expected_ship_days" INTEGER NOT NULL DEFAULT 3,
    "auto_confirm_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mart_images" (
    "id" TEXT NOT NULL,
    "mart_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mart_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mart_delivery_areas" (
    "id" TEXT NOT NULL,
    "mart_id" TEXT NOT NULL,
    "province" VARCHAR(50),
    "province_code" VARCHAR(10),
    "city" VARCHAR(50),
    "city_code" VARCHAR(10),
    "district" VARCHAR(50),
    "district_code" VARCHAR(10),
    "level" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mart_delivery_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods" (
    "id" TEXT NOT NULL,
    "mart_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "specification" VARCHAR(200),
    "price" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2),
    "repertory" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "is_set_group" BOOLEAN NOT NULL DEFAULT false,
    "group_sum" INTEGER,
    "low_stock_threshold" INTEGER,
    "purchase_limit" INTEGER,
    "cost" DECIMAL(10,2),
    "material_cost_items" TEXT,
    "labor_cost" DECIMAL(10,2),
    "packaging_cost" DECIMAL(10,2),
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_images" (
    "id" TEXT NOT NULL,
    "goods_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_no" VARCHAR(32) NOT NULL,
    "mart_id" TEXT,
    "user_id" TEXT,
    "receiver_name" VARCHAR(50) NOT NULL,
    "receiver_phone" VARCHAR(20) NOT NULL,
    "province" VARCHAR(50) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "district" VARCHAR(50) NOT NULL,
    "detail_address" VARCHAR(500) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "freight_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "goods_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "shipping_company" VARCHAR(100),
    "shipping_no" VARCHAR(100),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "buyer_remark" TEXT,
    "seller_remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "goods_id" TEXT,
    "goods_name" VARCHAR(200) NOT NULL,
    "goods_image" TEXT,
    "specification" VARCHAR(200),
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "goods_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_delivery_tracks" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(200),
    "operator" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_delivery_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mart_participations" (
    "id" TEXT NOT NULL,
    "mart_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mart_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "type" VARCHAR(50) NOT NULL DEFAULT 'system',
    "related_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "mart_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL DEFAULT '克',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "low_stock_alerts" (
    "id" TEXT NOT NULL,
    "goods_id" TEXT NOT NULL,
    "mart_id" TEXT,
    "threshold" INTEGER NOT NULL,
    "current_stock" INTEGER NOT NULL,
    "alerted_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goods_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_suggestions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "goods_id" TEXT NOT NULL,
    "suggestion_type" VARCHAR(50),
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "processor_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "goods_id" TEXT NOT NULL,
    "mart_id" TEXT,
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT,
    "review_type" VARCHAR(20) NOT NULL DEFAULT 'goods',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "category" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carousels" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200),
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "link_type" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carousels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cities" (
    "code" VARCHAR(10) NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "districts" (
    "code" VARCHAR(10) NOT NULL,
    "city_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "shipping_addresses_user_id_idx" ON "shipping_addresses"("user_id");

-- CreateIndex
CREATE INDEX "shipping_addresses_user_id_is_default_idx" ON "shipping_addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "marts_user_id_idx" ON "marts"("user_id");

-- CreateIndex
CREATE INDEX "marts_status_idx" ON "marts"("status");

-- CreateIndex
CREATE INDEX "marts_finish_time_idx" ON "marts"("finish_time");

-- CreateIndex
CREATE INDEX "marts_created_at_idx" ON "marts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "mart_delivery_areas_mart_id_idx" ON "mart_delivery_areas"("mart_id");

-- CreateIndex
CREATE INDEX "mart_delivery_areas_province_code_city_code_district_code_idx" ON "mart_delivery_areas"("province_code", "city_code", "district_code");

-- CreateIndex
CREATE INDEX "goods_mart_id_idx" ON "goods"("mart_id");

-- CreateIndex
CREATE INDEX "goods_category_id_idx" ON "goods"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_mart_id_idx" ON "orders"("mart_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_order_no_idx" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_province_city_idx" ON "orders"("province", "city");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_delivery_tracks_order_id_idx" ON "order_delivery_tracks"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "mart_participations_order_id_key" ON "mart_participations"("order_id");

-- CreateIndex
CREATE INDEX "mart_participations_mart_id_idx" ON "mart_participations"("mart_id");

-- CreateIndex
CREATE INDEX "mart_participations_user_id_idx" ON "mart_participations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mart_participations_mart_id_user_id_key" ON "mart_participations"("mart_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

-- CreateIndex
CREATE INDEX "messages_user_id_is_read_idx" ON "messages"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "materials_mart_id_idx" ON "materials"("mart_id");

-- CreateIndex
CREATE INDEX "low_stock_alerts_goods_id_idx" ON "low_stock_alerts"("goods_id");

-- CreateIndex
CREATE INDEX "low_stock_alerts_status_idx" ON "low_stock_alerts"("status");

-- CreateIndex
CREATE INDEX "goods_likes_user_id_idx" ON "goods_likes"("user_id");

-- CreateIndex
CREATE INDEX "goods_likes_goods_id_idx" ON "goods_likes"("goods_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_likes_user_id_goods_id_key" ON "goods_likes"("user_id", "goods_id");

-- CreateIndex
CREATE INDEX "goods_suggestions_user_id_idx" ON "goods_suggestions"("user_id");

-- CreateIndex
CREATE INDEX "goods_suggestions_goods_id_idx" ON "goods_suggestions"("goods_id");

-- CreateIndex
CREATE INDEX "goods_suggestions_status_idx" ON "goods_suggestions"("status");

-- CreateIndex
CREATE INDEX "goods_reviews_user_id_idx" ON "goods_reviews"("user_id");

-- CreateIndex
CREATE INDEX "goods_reviews_goods_id_idx" ON "goods_reviews"("goods_id");

-- CreateIndex
CREATE INDEX "goods_reviews_goods_id_is_approved_idx" ON "goods_reviews"("goods_id", "is_approved");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_config_key_key" ON "system_configs"("config_key");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marts" ADD CONSTRAINT "marts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mart_images" ADD CONSTRAINT "mart_images_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mart_delivery_areas" ADD CONSTRAINT "mart_delivery_areas_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "goods_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_images" ADD CONSTRAINT "goods_images_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_tracks" ADD CONSTRAINT "order_delivery_tracks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mart_participations" ADD CONSTRAINT "mart_participations_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mart_participations" ADD CONSTRAINT "mart_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mart_participations" ADD CONSTRAINT "mart_participations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_likes" ADD CONSTRAINT "goods_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_likes" ADD CONSTRAINT "goods_likes_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_suggestions" ADD CONSTRAINT "goods_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_suggestions" ADD CONSTRAINT "goods_suggestions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_suggestions" ADD CONSTRAINT "goods_suggestions_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_suggestions" ADD CONSTRAINT "goods_suggestions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_reviews" ADD CONSTRAINT "goods_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_reviews" ADD CONSTRAINT "goods_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_reviews" ADD CONSTRAINT "goods_reviews_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_reviews" ADD CONSTRAINT "goods_reviews_mart_id_fkey" FOREIGN KEY ("mart_id") REFERENCES "marts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_code_fkey" FOREIGN KEY ("province_code") REFERENCES "provinces"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
