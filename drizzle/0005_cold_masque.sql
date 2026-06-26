CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'canceled');--> statement-breakpoint
CREATE TABLE "biz_daily_report_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"snapshot_item_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_key" varchar(80) DEFAULT 'free' NOT NULL,
	"plan_name" varchar(120) DEFAULT '免费用户' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"history_days" integer DEFAULT 30 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "biz_daily_report_item" ADD CONSTRAINT "biz_daily_report_item_report_id_biz_daily_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."biz_daily_report"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_daily_report_item" ADD CONSTRAINT "biz_daily_report_item_snapshot_item_id_biz_snapshot_item_id_fk" FOREIGN KEY ("snapshot_item_id") REFERENCES "public"."biz_snapshot_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biz_daily_report_item" ADD CONSTRAINT "biz_daily_report_item_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_membership" ADD CONSTRAINT "user_membership_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uk_biz_daily_report_item" ON "biz_daily_report_item" USING btree ("report_id","snapshot_item_id");--> statement-breakpoint
CREATE INDEX "idx_biz_daily_report_item_report_sort" ON "biz_daily_report_item" USING btree ("report_id","sort");--> statement-breakpoint
CREATE INDEX "idx_biz_daily_report_item_snapshot" ON "biz_daily_report_item" USING btree ("snapshot_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_user_membership_user" ON "user_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_membership_status_expiry" ON "user_membership" USING btree ("status","expires_at");