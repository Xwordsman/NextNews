CREATE TABLE "sys_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(160) NOT NULL,
	"setting_value" text DEFAULT '' NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uk_sys_setting_key" ON "sys_setting" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "idx_sys_setting_public" ON "sys_setting" USING btree ("is_public");