/*
  Warnings:

  - A unique constraint covering the columns `[sponsorId,sequentialId]` on the table `Bounties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listingId,sequentialId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- First add the columns without constraints
ALTER TABLE `Bounties` ADD COLUMN `sequentialId` INTEGER NULL;
ALTER TABLE `Sponsors` ADD COLUMN `listingCounter` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `Submission` ADD COLUMN `sequentialId` INTEGER NULL;

-- Update Bounties with sequential IDs grouped by sponsor
UPDATE Bounties b
JOIN (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY sponsorId ORDER BY createdAt) as row_num
    FROM Bounties
    WHERE isArchived = false
) as t
SET b.sequentialId = t.row_num
WHERE b.id = t.id;

-- Update Sponsors listingCounter to max sequentialId
UPDATE Sponsors s
LEFT JOIN (
    SELECT sponsorId, MAX(sequentialId) as max_id
    FROM Bounties
    WHERE isArchived = false
    GROUP BY sponsorId
) as b ON s.id = b.sponsorId
SET s.listingCounter = COALESCE(b.max_id, 0);

-- Update Submissions with sequential IDs grouped by listing
UPDATE Submission s
JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY listingId ORDER BY createdAt) as row_num
    FROM Submission
    WHERE isArchived = false
) as t
SET s.sequentialId = t.row_num
WHERE s.id = t.id;

-- Now create the unique indexes
CREATE UNIQUE INDEX `Bounties_sponsorId_sequentialId_key` ON `Bounties`(`sponsorId`, `sequentialId`);
CREATE UNIQUE INDEX `Submission_listingId_sequentialId_key` ON `Submission`(`listingId`, `sequentialId`);
