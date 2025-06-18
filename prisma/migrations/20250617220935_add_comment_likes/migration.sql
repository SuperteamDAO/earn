-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `like` JSON NULL,
    ADD COLUMN `likeCount` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Comment_likeCount_idx` ON `Comment`(`likeCount`);
