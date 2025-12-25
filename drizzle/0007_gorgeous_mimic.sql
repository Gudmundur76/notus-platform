CREATE TABLE `credential_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credential_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` enum('view','use','update','delete','rotate') NOT NULL,
	`task_id` int,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credential_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credentials_vault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('api_key','oauth_token','database','service','other') NOT NULL,
	`encrypted_value` text NOT NULL,
	`encryption_iv` varchar(32) NOT NULL,
	`description` text,
	`service_url` varchar(500),
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`rotation_reminder` int DEFAULT 90,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credentials_vault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployment_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` enum('vercel','railway','render','docker','aws','gcp','custom') NOT NULL,
	`config` text NOT NULL,
	`env_vars` text,
	`status` enum('draft','ready','deployed','failed') NOT NULL DEFAULT 'draft',
	`last_deployed_at` timestamp,
	`deployment_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployment_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `handoff_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_state_id` int,
	`title` varchar(255) NOT NULL,
	`project_overview` text NOT NULL,
	`current_progress` text NOT NULL,
	`next_steps` text NOT NULL,
	`key_decisions` text,
	`blockers` text,
	`relevant_files` text,
	`context_for_next_session` text NOT NULL,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `handoff_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`event_type` enum('task_started','task_completed','task_failed','agent_started','agent_completed','agent_error','memory_access','credential_access','session_created','session_restored','system_health','error') NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`source` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`task_id` int,
	`agent_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoring_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`state` text NOT NULL,
	`context_summary` text,
	`active_task_ids` text,
	`memory_snapshot` text,
	`metadata` text,
	`is_active` int NOT NULL DEFAULT 1,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_states_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `system_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric_type` enum('active_tasks','completed_tasks','failed_tasks','active_agents','memory_usage','api_calls','response_time','error_rate') NOT NULL,
	`value` int NOT NULL,
	`unit` varchar(50),
	`metadata` text,
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_metrics_id` PRIMARY KEY(`id`)
);
