CREATE TYPE "public"."collector_type" AS ENUM('rss', 'adapter');--> statement-breakpoint
CREATE TYPE "public"."crawl_run_status" AS ENUM('running', 'success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."crawl_run_type" AS ENUM('scheduled', 'manual', 'retry');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('draft', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('active', 'duplicate', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "biz_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" varchar(120) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"parent_id" uuid,
	"icon" varchar(80),
	"color" varchar(32),
	"sort" integer DEFAULT 0 NOT NULL,
	"is_nav_visible" boolean DEFAULT true NOT NULL,
	"is_home_visible" boolean DEFAULT true NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"channel_name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"definition_key" varchar(180) NOT NULL,
	"collector_type" "collector_type" NOT NULL,
	"channel_type" varchar(80) DEFAULT 'rank',
	"homepage_url" text,
	"crawl_interval_seconds" integer DEFAULT 300 NOT NULL,
	"is_crawl_enabled" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_home_visible" boolean DEFAULT false NOT NULL,
	"is_subscribable" boolean DEFAULT true NOT NULL,
	"display_style" varchar(80) DEFAULT 'rank',
	"weight" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"last_snapshot_id" uuid,
	"last_crawl_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_channel_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"crawl_run_id" uuid,
	"snapshot_time" timestamp with time zone DEFAULT now() NOT NULL,
	"snapshot_date" date NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"content_hash" varchar(128) NOT NULL,
	"status" "snapshot_status" DEFAULT 'active' NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biz_content_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_title" text NOT NULL,
	"canonical_url" text NOT NULL,
	"url_hash" varchar(128) NOT NULL,
	"title_hash" varchar(128) NOT NULL,
	"first_channel_id" uuid,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"image_url" text,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" varchar(120) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"homepage_url" text,
	"logo_url" text,
	"description" text,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_snapshot_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"content_item_id" uuid,
	"rank_no" integer,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"url_hash" varchar(128) NOT NULL,
	"image_url" text,
	"summary" text,
	"hot_value" varchar(120),
	"hot_label" varchar(120),
	"tag" varchar(80),
	"published_at" timestamp with time zone,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_crawl_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"run_type" "crawl_run_type" DEFAULT 'scheduled' NOT NULL,
	"status" "crawl_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"fetched_count" integer DEFAULT 0 NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"snapshot_id" uuid,
	"error_message" text,
	"error_stack" text,
	"extra" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "rel_channel_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sys_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "biz_channel" ADD CONSTRAINT "biz_channel_site_id_biz_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."biz_site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_channel_snapshot" ADD CONSTRAINT "biz_channel_snapshot_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_content_item" ADD CONSTRAINT "biz_content_item_first_channel_id_biz_channel_id_fk" FOREIGN KEY ("first_channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_snapshot_item" ADD CONSTRAINT "biz_snapshot_item_snapshot_id_biz_channel_snapshot_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."biz_channel_snapshot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_snapshot_item" ADD CONSTRAINT "biz_snapshot_item_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_snapshot_item" ADD CONSTRAINT "biz_snapshot_item_content_item_id_biz_content_item_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."biz_content_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_crawl_run" ADD CONSTRAINT "log_crawl_run_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_channel_category" ADD CONSTRAINT "rel_channel_category_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_channel_category" ADD CONSTRAINT "rel_channel_category_category_id_biz_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."biz_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_category_slug" ON "biz_category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_biz_category_parent_sort" ON "biz_category" USING btree ("parent_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_channel_site_slug" ON "biz_channel" USING btree ("site_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_channel_definition_key" ON "biz_channel" USING btree ("definition_key");--> statement-breakpoint
CREATE INDEX "idx_biz_channel_site_status" ON "biz_channel" USING btree ("site_id","status");--> statement-breakpoint
CREATE INDEX "idx_biz_channel_home_sort" ON "biz_channel" USING btree ("is_home_visible","status","sort");--> statement-breakpoint
CREATE INDEX "idx_biz_channel_crawl_enabled" ON "biz_channel" USING btree ("is_crawl_enabled","status","last_crawl_at");--> statement-breakpoint
CREATE INDEX "idx_biz_channel_snapshot_channel_time" ON "biz_channel_snapshot" USING btree ("channel_id","snapshot_time");--> statement-breakpoint
CREATE INDEX "idx_biz_channel_snapshot_date" ON "biz_channel_snapshot" USING btree ("snapshot_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_channel_snapshot_hash" ON "biz_channel_snapshot" USING btree ("channel_id","content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_content_item_url_hash" ON "biz_content_item" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_biz_content_item_title_hash" ON "biz_content_item" USING btree ("title_hash");--> statement-breakpoint
CREATE INDEX "idx_biz_content_item_last_seen" ON "biz_content_item" USING btree ("last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_site_slug" ON "biz_site" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_biz_site_status_sort" ON "biz_site" USING btree ("status","sort");--> statement-breakpoint
CREATE INDEX "idx_biz_snapshot_item_snapshot_rank" ON "biz_snapshot_item" USING btree ("snapshot_id","rank_no");--> statement-breakpoint
CREATE INDEX "idx_biz_snapshot_item_channel_time" ON "biz_snapshot_item" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_biz_snapshot_item_url_hash" ON "biz_snapshot_item" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_log_crawl_run_channel_time" ON "log_crawl_run" USING btree ("channel_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_log_crawl_run_status_time" ON "log_crawl_run" USING btree ("status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_rel_channel_category" ON "rel_channel_category" USING btree ("channel_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_rel_channel_category_category" ON "rel_channel_category" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_sys_user_email" ON "sys_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_sys_user_status" ON "sys_user" USING btree ("status");