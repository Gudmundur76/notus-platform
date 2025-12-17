ALTER TABLE `tasks` ADD `type` enum('general','slides','website','app','design','computer_control') NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `taskType`;