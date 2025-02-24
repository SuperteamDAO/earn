-- AlterTable
ALTER TABLE `Bounties` MODIFY `type` ENUM('bounty', 'project', 'hackathon', 'sponsorship') NOT NULL DEFAULT 'bounty';

-- AlterTable
ALTER TABLE `BountiesTemplates` MODIFY `type` ENUM('bounty', 'project', 'hackathon', 'sponsorship') NOT NULL DEFAULT 'bounty';
