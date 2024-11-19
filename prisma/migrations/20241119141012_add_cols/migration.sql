-- AlterTable
ALTER TABLE `Bounties` ADD COLUMN `isLockedPayment` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Sponsors` ADD COLUMN `telegram` VARCHAR(191) NULL,
    ADD COLUMN `wechat` VARCHAR(191) NULL,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `wechat` TEXT NULL;
