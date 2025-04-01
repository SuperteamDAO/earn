/*
  Warnings:

  - Made the column `sequentialId` on table `Bounties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sequentialId` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- Update Bounties with sequential IDs grouped by sponsor
UPDATE Bounties b
JOIN (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY sponsorId ORDER BY createdAt) as row_num
    FROM Bounties
    WHERE isArchived = false AND sequentialId IS NULL
) as t
JOIN Sponsors s ON b.sponsorId = s.id
SET b.sequentialId = s.listingCounter + t.row_num
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

-- AlterTable
ALTER TABLE `Bounties` MODIFY `sequentialId` INTEGER NOT NULL;
ALTER TABLE `Submission` MODIFY `sequentialId` INTEGER NOT NULL;
