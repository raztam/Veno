CREATE TABLE `daily_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`usage_date` text NOT NULL,
	`recorded_ms` integer DEFAULT 0 NOT NULL
);
