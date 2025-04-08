-- Conditionally add submissionCounter to Sponsors
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_name = 'Sponsors' AND column_name = 'submissionCounter' AND table_schema = DATABASE()
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Sponsors ADD COLUMN submissionCounter INTEGER NOT NULL DEFAULT 0;',
    'SELECT "Column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Conditionally drop unique index on Submission.Submission_listingId_sequentialId_key
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_name = 'Submission'
    AND index_name = 'Submission_listingId_sequentialId_key'
    AND table_schema = DATABASE()
);

SET @sql = IF(@index_exists > 0,
    'ALTER TABLE Submission DROP INDEX Submission_listingId_sequentialId_key;',
    'SELECT "Index does not exist";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Assign sequential IDs by sponsor
UPDATE Submission s
JOIN (
    SELECT s.id, 
           ROW_NUMBER() OVER (PARTITION BY b.sponsorId ORDER BY s.createdAt) as row_num
    FROM Submission s
    JOIN Bounties b ON s.listingId = b.id
    WHERE s.isArchived = false
) as t
SET s.sequentialId = t.row_num
WHERE s.id = t.id;

-- Update Sponsors' submissionCounter with max sequentialId
UPDATE Sponsors s
LEFT JOIN (
    SELECT sponsorId, MAX(sub.sequentialId) as max_id
    FROM Submission as sub  
    JOIN Bounties b ON sub.listingId = b.id
    WHERE sub.isArchived = false
    GROUP BY sponsorId
) as b ON s.id = b.sponsorId
SET s.submissionCounter = COALESCE(b.max_id, 0);
