ALTER TABLE `memory_entries` ADD `category` varchar(100);--> statement-breakpoint
ALTER TABLE `memory_entries` ADD `is_pinned` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `memory_entries` ADD `tags` text;