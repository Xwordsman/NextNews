CREATE TABLE "biz_home_module" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_key" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"subtitle" text,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"display_limit" integer DEFAULT 8 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biz_ranking_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"time_window_hours" integer DEFAULT 24 NOT NULL,
	"item_limit" integer DEFAULT 50 NOT NULL,
	"per_channel_limit" integer DEFAULT 10 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rel_ranking_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ranking_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rel_topic_snapshot_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"snapshot_item_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_pinned" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" varchar(80) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"href" text,
	"source_type" varchar(80),
	"source_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tracking_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_item_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"matched_keyword" varchar(160) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rel_ranking_channel" ADD CONSTRAINT "rel_ranking_channel_ranking_id_biz_ranking_config_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."biz_ranking_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_ranking_channel" ADD CONSTRAINT "rel_ranking_channel_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_topic_snapshot_item" ADD CONSTRAINT "rel_topic_snapshot_item_topic_id_biz_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."biz_topic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_topic_snapshot_item" ADD CONSTRAINT "rel_topic_snapshot_item_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_topic_snapshot_item" ADD CONSTRAINT "rel_topic_snapshot_item_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tracking_match" ADD CONSTRAINT "user_tracking_match_rule_id_user_tracking_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."user_tracking_rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tracking_match" ADD CONSTRAINT "user_tracking_match_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tracking_match" ADD CONSTRAINT "user_tracking_match_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_home_module_key" ON "biz_home_module" USING btree ("module_key");--> statement-breakpoint
CREATE INDEX "idx_biz_home_module_status_sort" ON "biz_home_module" USING btree ("status","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_ranking_config_slug" ON "biz_ranking_config" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_biz_ranking_config_status_sort" ON "biz_ranking_config" USING btree ("status","sort");--> statement-breakpoint
CREATE INDEX "idx_biz_ranking_config_default" ON "biz_ranking_config" USING btree ("is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_rel_ranking_channel" ON "rel_ranking_channel" USING btree ("ranking_id","channel_id");--> statement-breakpoint
CREATE INDEX "idx_rel_ranking_channel_ranking_sort" ON "rel_ranking_channel" USING btree ("ranking_id","sort");--> statement-breakpoint
CREATE INDEX "idx_rel_ranking_channel_channel" ON "rel_ranking_channel" USING btree ("channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_rel_topic_snapshot_item" ON "rel_topic_snapshot_item" USING btree ("topic_id","snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_rel_topic_snapshot_item_topic_sort" ON "rel_topic_snapshot_item" USING btree ("topic_id","sort");--> statement-breakpoint
CREATE INDEX "idx_rel_topic_snapshot_item_snapshot" ON "rel_topic_snapshot_item" USING btree ("snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_user_notification_user_time" ON "user_notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_notification_unread" ON "user_notification" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_user_tracking_match_rule_item" ON "user_tracking_match" USING btree ("rule_id","snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_user_tracking_match_user_time" ON "user_tracking_match" USING btree ("user_id","matched_at");--> statement-breakpoint
CREATE INDEX "idx_user_tracking_match_rule_time" ON "user_tracking_match" USING btree ("rule_id","matched_at");