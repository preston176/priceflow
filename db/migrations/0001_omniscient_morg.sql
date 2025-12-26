ALTER TABLE "gifts" ADD COLUMN "auto_update_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "last_auto_update" timestamp;