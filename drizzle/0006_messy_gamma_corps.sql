CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'success', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."membership_order_status" AS ENUM('pending', 'paid', 'canceled', 'refunded');--> statement-breakpoint
CREATE TABLE "biz_daily_report_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_name" varchar(160) NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"title_pattern" varchar(200) DEFAULT 'NextNews 日报 {date}' NOT NULL,
	"summary_pattern" text,
	"channel_limit" integer DEFAULT 8 NOT NULL,
	"item_limit_per_channel" integer DEFAULT 5 NOT NULL,
	"auto_publish" boolean DEFAULT false NOT NULL,
	"require_review" boolean DEFAULT true NOT NULL,
	"schedule_time" varchar(16) DEFAULT '09:00' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "log_search_query" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"keyword" varchar(200) NOT NULL,
	"site_slug" varchar(160),
	"channel_id" uuid,
	"date_from" date,
	"date_to" date,
	"result_count" integer DEFAULT 0 NOT NULL,
	"source_ip" varchar(80),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"plan_key" varchar(80) NOT NULL,
	"plan_name" varchar(120) NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" varchar(12) DEFAULT 'CNY' NOT NULL,
	"status" "membership_order_status" DEFAULT 'pending' NOT NULL,
	"payment_provider" varchar(80),
	"provider_trade_no" varchar(160),
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"raw_payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "membership_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_key" varchar(80) NOT NULL,
	"plan_name" varchar(120) NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" varchar(12) DEFAULT 'CNY' NOT NULL,
	"history_days" integer DEFAULT 30 NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sys_job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(120) NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sys_operation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" varchar(120) NOT NULL,
	"target_type" varchar(120),
	"target_id" uuid,
	"summary" text,
	"source_ip" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_item_id" uuid NOT NULL,
	"channel_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_read_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot_item_id" uuid NOT NULL,
	"channel_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"read_count" integer DEFAULT 1 NOT NULL,
	"first_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log_search_query" ADD CONSTRAINT "log_search_query_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_search_query" ADD CONSTRAINT "log_search_query_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_order" ADD CONSTRAINT "membership_order_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_order" ADD CONSTRAINT "membership_order_plan_id_membership_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sys_operation_log" ADD CONSTRAINT "sys_operation_log_admin_id_sys_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmark" ADD CONSTRAINT "user_bookmark_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmark" ADD CONSTRAINT "user_bookmark_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmark" ADD CONSTRAINT "user_bookmark_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_read_history" ADD CONSTRAINT "user_read_history_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_read_history" ADD CONSTRAINT "user_read_history_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_read_history" ADD CONSTRAINT "user_read_history_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_biz_daily_report_template_status_sort" ON "biz_daily_report_template" USING btree ("status","sort");--> statement-breakpoint
CREATE INDEX "idx_log_search_query_keyword_time" ON "log_search_query" USING btree ("keyword","created_at");--> statement-breakpoint
CREATE INDEX "idx_log_search_query_user_time" ON "log_search_query" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_membership_order_user_time" ON "membership_order" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_membership_order_status_time" ON "membership_order" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_membership_order_provider_trade" ON "membership_order" USING btree ("payment_provider","provider_trade_no");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_membership_plan_key" ON "membership_plan" USING btree ("plan_key");--> statement-breakpoint
CREATE INDEX "idx_membership_plan_enabled_sort" ON "membership_plan" USING btree ("is_enabled","sort");--> statement-breakpoint
CREATE INDEX "idx_sys_job_queue_status_available" ON "sys_job_queue" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "idx_sys_job_queue_type_time" ON "sys_job_queue" USING btree ("job_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_sys_operation_log_admin_time" ON "sys_operation_log" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sys_operation_log_action_time" ON "sys_operation_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_user_bookmark_item" ON "user_bookmark" USING btree ("user_id","snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_user_bookmark_user_time" ON "user_bookmark" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_user_read_history_item" ON "user_read_history" USING btree ("user_id","snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_user_read_history_user_time" ON "user_read_history" USING btree ("user_id","last_read_at");