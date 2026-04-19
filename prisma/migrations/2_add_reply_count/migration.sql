-- Add replyCount column to comments table
ALTER TABLE "comments" ADD COLUMN "replyCount" INTEGER NOT NULL DEFAULT 0;

-- Create index on replyCount for trending queries
CREATE INDEX "comments_replyCount_idx" ON "comments"("replyCount" DESC);
