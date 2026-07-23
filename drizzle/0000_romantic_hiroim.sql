CREATE TABLE `course_progress` (
	`user_email` text NOT NULL,
	`course_id` text NOT NULL,
	`completed_units` integer DEFAULT 0 NOT NULL,
	`passed` integer DEFAULT false NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_email`, `course_id`)
);
