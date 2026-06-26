CREATE TABLE "biz_content_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid,
	"snapshot_item_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"url_hash" varchar(128) NOT NULL,
	"reason" text,
	"created_by" uuid,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_daily_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" date NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text,
	"status" "entity_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"channel_limit" integer DEFAULT 8 NOT NULL,
	"item_limit_per_channel" integer DEFAULT 5 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_topic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"keywords" text DEFAULT '' NOT NULL,
	"status" "entity_status" DEFAULT 'draft' NOT NULL,
	"is_home_visible" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_tracking_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword" varchar(160) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"notify_enabled" boolean DEFAULT false NOT NULL,
	"last_matched_at" timestamp with time zone,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biz_content_block" ADD CONSTRAINT "biz_content_block_content_item_id_biz_content_item_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."biz_content_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_content_block" ADD CONSTRAINT "biz_content_block_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_content_block" ADD CONSTRAINT "biz_content_block_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tracking_rule" ADD CONSTRAINT "user_tracking_rule_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_biz_content_block_url_hash" ON "biz_content_block" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_biz_content_block_deleted" ON "biz_content_block" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_biz_content_block_snapshot_item" ON "biz_content_block" USING btree ("snapshot_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_daily_report_date" ON "biz_daily_report" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "idx_biz_daily_report_status_date" ON "biz_daily_report" USING btree ("status","report_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_topic_slug" ON "biz_topic" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_biz_topic_status_sort" ON "biz_topic" USING btree ("status","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_user_tracking_rule_keyword" ON "user_tracking_rule" USING btree ("user_id","keyword");--> statement-breakpoint
CREATE INDEX "idx_user_tracking_rule_user" ON "user_tracking_rule" USING btree ("user_id","is_enabled");