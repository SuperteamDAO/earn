ALTER TABLE `User` ADD COLUMN `name` VARCHAR(255) NULL;

UPDATE `User` 
SET `name` = CASE 
    WHEN `firstName` IS NOT NULL AND `lastName` IS NOT NULL THEN CONCAT(`firstName`, ' ', `lastName`)
    WHEN `firstName` IS NOT NULL AND `lastName` IS NULL THEN `firstName`
    WHEN `firstName` IS NULL AND `lastName` IS NOT NULL THEN `lastName`
    ELSE NULL
END;

DROP INDEX `User_firstName_idx` ON `User`;
DROP INDEX `User_lastName_idx` ON `User`;

ALTER TABLE `User` DROP COLUMN `firstName`, DROP COLUMN `lastName`;

CREATE INDEX `User_name_idx` ON `User`(`name`);
