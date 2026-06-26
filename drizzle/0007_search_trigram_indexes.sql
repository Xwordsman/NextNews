CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_biz_snapshot_item_title_trgm" ON "biz_snapshot_item" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_biz_snapshot_item_summary_trgm" ON "biz_snapshot_item" USING gin ("summary" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_biz_snapshot_item_tag_trgm" ON "biz_snapshot_item" USING gin ("tag" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_log_search_query_keyword_trgm" ON "log_search_query" USING gin ("keyword" gin_trgm_ops);
