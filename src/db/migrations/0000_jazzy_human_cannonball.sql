CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`audio_uri` text NOT NULL,
	`transcript` text NOT NULL,
	`summary` text,
	`tags` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text,
	`text` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
