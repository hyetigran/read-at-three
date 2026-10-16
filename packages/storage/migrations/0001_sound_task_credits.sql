CREATE TABLE `task_credit` (
	`credit_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`task_id` text NOT NULL,
	`session_id` text NOT NULL,
	`run_id` text NOT NULL,
	`terminal_advance_id` text NOT NULL,
	`package_hash` text NOT NULL,
	`outcome` text NOT NULL,
	`status` text NOT NULL,
	`receipt_version` integer NOT NULL,
	`receipt` text NOT NULL,
	FOREIGN KEY (`run_id`,`session_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`) REFERENCES `task_run`(`run_id`,`session_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`terminal_advance_id`,`run_id`) REFERENCES `task_advance`(`advance_id`,`run_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "package_hash_hash" CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "credit_outcome" CHECK(outcome IN ('completed','skipped')),
	CONSTRAINT "credit_status" CHECK(status IN ('valid','withdrawn')),
	CONSTRAINT "credit_receipt_version" CHECK(receipt_version=1),
	CONSTRAINT "credit_receipt_json" CHECK(json_valid(receipt))
);
--> statement-breakpoint
CREATE INDEX `credit_owner_task` ON `task_credit` (`profile_id`,`generation`,`course_id`,`task_id`,`status`);--> statement-breakpoint
CREATE INDEX `credit_package` ON `task_credit` (`package_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_credit_terminal_advance_id_unique` ON `task_credit` (`terminal_advance_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_credit_credit_id_profile_id_generation_course_id_lesson_id_task_id_outcome_unique` ON `task_credit` (`credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`,`task_id`,`outcome`);--> statement-breakpoint
CREATE TABLE `task_result` (
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`task_id` text NOT NULL,
	`outcome` text NOT NULL,
	`accepted_credit_id` text NOT NULL,
	PRIMARY KEY(`profile_id`, `generation`, `course_id`, `task_id`),
	FOREIGN KEY (`accepted_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`,`task_id`,`outcome`) REFERENCES `task_credit`(`credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`,`task_id`,`outcome`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "result_outcome" CHECK(outcome IN ('completed','skipped'))
);
--> statement-breakpoint
CREATE INDEX `result_owner_lesson` ON `task_result` (`profile_id`,`generation`,`course_id`,`lesson_id`);