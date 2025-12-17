CREATE TABLE `agent_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`metric_date` timestamp NOT NULL DEFAULT (now()),
	`dialogues_participated` int NOT NULL DEFAULT 0,
	`knowledge_contributions` int NOT NULL DEFAULT 0,
	`average_confidence` int NOT NULL DEFAULT 0,
	`debates_won` int NOT NULL DEFAULT 0,
	`questions_asked` int NOT NULL DEFAULT 0,
	`questions_answered` int NOT NULL DEFAULT 0,
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_pairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primary_agent_id` int NOT NULL,
	`mirror_agent_id` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`pairing_strategy` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_pairs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`type` enum('primary','mirror') NOT NULL,
	`system_prompt` text NOT NULL,
	`capabilities` text,
	`status` enum('active','inactive','training') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dialogue_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dialogue_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`role` enum('thesis','antithesis','synthesis','question','answer','observation') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dialogue_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dialogues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_pair_id` int NOT NULL,
	`topic` varchar(500) NOT NULL,
	`type` enum('debate','research','question_seeking','knowledge_refinement') NOT NULL,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `dialogues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_core` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`topic` varchar(500) NOT NULL,
	`insight` text NOT NULL,
	`confidence` int NOT NULL,
	`source_dialogue_ids` text,
	`contributing_agents` text,
	`tags` text,
	`version` int NOT NULL DEFAULT 1,
	`supersedes` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_core_id` PRIMARY KEY(`id`)
);
