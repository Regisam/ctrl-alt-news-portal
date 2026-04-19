-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM ('REPLY', 'MENTION', 'KARMA_MILESTONE');

-- Create notifications table
CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "content" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "relatedCommentId" TEXT,
  "relatedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_relatedCommentId_idx" ON "notifications"("relatedCommentId");
CREATE INDEX "notifications_relatedUserId_idx" ON "notifications"("relatedUserId");

-- Add foreign key constraints
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedCommentId_fkey" FOREIGN KEY ("relatedCommentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
