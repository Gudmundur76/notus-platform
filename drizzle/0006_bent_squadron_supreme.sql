CREATE TABLE `agent_training_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`training_type` enum('feedback','performance','manual') NOT NULL,
	`feedback_count` int NOT NULL DEFAULT 0,
	`positive_count` int NOT NULL DEFAULT 0,
	`negative_count` int NOT NULL DEFAULT 0,
	`previous_system_prompt` text,
	`updated_system_prompt` text,
	`performance_before_training` int,
	`performance_after_training` int,
	`improvement_notes` text,
	`status` enum('pending','applied','rolled_back') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`applied_at` timestamp,
	CONSTRAINT `agent_training_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`feedback_type` enum('positive','negative','neutral') NOT NULL,
	`feedback_text` text,
	`improvement_suggestions` text,
	`was_helpful` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_feedback_id` PRIMARY KEY(`id`)
);
