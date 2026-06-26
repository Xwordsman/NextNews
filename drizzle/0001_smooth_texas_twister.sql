CREATE TABLE "rel_user_channel_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"notify_enabled" boolean DEFAULT false NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rel_user_channel_subscription" ADD CONSTRAINT "rel_user_channel_subscription_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rel_user_channel_subscription" ADD CONSTRAINT "rel_user_channel_subscription_channel_id_biz_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."biz_channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uk_rel_user_channel_subscription" ON "rel_user_channel_subscription" USING btree ("user_id","channel_id");--> statement-breakpoint
CREATE INDEX "idx_rel_user_channel_subscription_user" ON "rel_user_channel_subscription" USING btree ("user_id","sort");--> statement-breakpoint
CREATE INDEX "idx_rel_user_channel_subscription_channel" ON "rel_user_channel_subscription" USING btree ("channel_id");