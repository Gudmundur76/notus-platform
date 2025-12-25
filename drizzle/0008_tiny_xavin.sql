CREATE TABLE `skill_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`is_helpful` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`language` enum('python','typescript','javascript','bash','other') NOT NULL,
	`content` text NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`format` enum('markdown','json','yaml','text','other') NOT NULL DEFAULT 'markdown',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`user_id` int NOT NULL,
	`task_id` int,
	`success` int NOT NULL DEFAULT 1,
	`execution_time` int,
	`feedback` text,
	`used_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('development','data_analysis','business','communication','creative','productivity','security','other') NOT NULL,
	`content` text NOT NULL,
	`when_to_use` text,
	`instructions` text,
	`examples` text,
	`is_public` int NOT NULL DEFAULT 0,
	`is_built_in` int NOT NULL DEFAULT 0,
	`created_by` int,
	`version` varchar(20) NOT NULL DEFAULT '1.0.0',
	`rating` int NOT NULL DEFAULT 0,
	`rating_count` int NOT NULL DEFAULT 0,
	`install_count` int NOT NULL DEFAULT 0,
	`tags` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`skill_id` int NOT NULL,
	`is_enabled` int NOT NULL DEFAULT 1,
	`custom_config` text,
	`installed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_skills_id` PRIMARY KEY(`id`)
);
