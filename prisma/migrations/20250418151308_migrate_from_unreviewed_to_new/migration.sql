/*
  Warnings:

  - You are about to alter the column `label` on the `GrantApplication` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(14))` to `Enum(EnumId(17))`.
  - You are about to alter the column `label` on the `Submission` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(16))` to `Enum(EnumId(17))`.

*/
START TRANSACTION;

-- Step 1: First add 'New' to the enum
ALTER TABLE `GrantApplication` MODIFY `label` ENUM('Unreviewed', 'New', 'Reviewed', 'Shortlisted', 'Spam') NOT NULL DEFAULT 'Unreviewed';
ALTER TABLE `Submission` MODIFY `label` ENUM('Unreviewed', 'New', 'Reviewed', 'Shortlisted', 'Spam') NOT NULL DEFAULT 'Unreviewed';

-- Step 2: Migrate data from 'Unreviewed' to 'New'
UPDATE `GrantApplication` SET `label` = 'New' WHERE `label` = 'Unreviewed';
UPDATE `Submission` SET `label` = 'New' WHERE `label` = 'Unreviewed';

-- Step 3: Remove 'Unreviewed' from the enum and set 'New' as default
ALTER TABLE `GrantApplication` MODIFY `label` ENUM('New', 'Reviewed', 'Shortlisted', 'Spam') NOT NULL DEFAULT 'New';
ALTER TABLE `Submission` MODIFY `label` ENUM('New', 'Reviewed', 'Shortlisted', 'Spam') NOT NULL DEFAULT 'New';

COMMIT;
