CREATE TABLE "post_media" (
	"post_id" varchar(36) NOT NULL,
	"media_id" varchar(36) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_media_post_id_media_id_pk" PRIMARY KEY("post_id","media_id")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "thumbnail_media_id" varchar(36);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "icon" varchar(40) DEFAULT 'craft' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "status" varchar(24) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_by" varchar(36);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_by" varchar(36);--> statement-breakpoint
ALTER TABLE "category_i18n" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_mode" varchar(24) DEFAULT 'contact' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_status" varchar(24) DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "made_to_order" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "lead_time" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "materials" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(12, 3);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_new" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" varchar(24) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_by" varchar(36);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_by" varchar(36);--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_thumbnail_media_id_media_id_fk" FOREIGN KEY ("thumbnail_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_public_idx" ON "categories" USING btree ("status","is_enabled","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_unique" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_catalog_idx" ON "products" USING btree ("category_id","status","sort_order");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured","status");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_status_valid" CHECK ("categories"."status" IN ('draft','published','hidden'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_prices_nonnegative" CHECK ("products"."price" >= 0 AND "products"."sale_price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_quantity_nonnegative" CHECK ("products"."quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_weight_nonnegative" CHECK ("products"."weight" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sale_valid" CHECK ("products"."sale_price" IS NULL OR ("products"."price" IS NOT NULL AND "products"."sale_price" <= "products"."price"));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_status_valid" CHECK ("products"."status" IN ('draft','published','out_of_stock','hidden','archived'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_mode_valid" CHECK ("products"."price_mode" IN ('exact','from','contact','made_to_order','showcase'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_valid" CHECK ("products"."stock_status" IN ('available','out_of_stock','made_to_order'));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_required" CHECK ("products"."price_mode" NOT IN ('exact','from') OR "products"."price" IS NOT NULL);