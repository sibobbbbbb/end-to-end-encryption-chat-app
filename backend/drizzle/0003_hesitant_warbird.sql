ALTER TABLE "users" ADD COLUMN "nonce" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";