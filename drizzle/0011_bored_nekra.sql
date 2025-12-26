CREATE TABLE `memory_access_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memory_id` int NOT NULL,
	`user_id` int NOT NULL,
	`access_type` enum('read','write','search','context') NOT NULL,
	`context` varchar(255),
	`relevance_score` int,
	`accessed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memory_access_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_analytics_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_memories` int NOT NULL,
	`fact_count` int NOT NULL,
	`preference_count` int NOT NULL,
	`context_count` int NOT NULL,
	`avg_importance` int NOT NULL,
	`avg_access_count` int NOT NULL,
	`snapshot_date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memory_analytics_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`version` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`instructions` text,
	`examples` text,
	`changelog` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_skill_version_pins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`skill_id` int NOT NULL,
	`version_id` int NOT NULL,
	`pinned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_skill_version_pins_id` PRIMARY KEY(`id`)
);
