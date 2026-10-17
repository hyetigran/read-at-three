CREATE TABLE `lesson_credit` (
	`lesson_credit_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`package_hash` text NOT NULL,
	`status` text NOT NULL,
	`receipt_version` integer NOT NULL,
	`receipt` text NOT NULL,
	`support_hash` text NOT NULL,
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`package_hash`,`course_id`) REFERENCES `installed_package`(`package_hash`,`course_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "package_hash_hash" CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "support_hash_hash" CHECK(length(support_hash)=64 AND support_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "lesson_credit_status" CHECK(status IN ('valid','withdrawn')),
	CONSTRAINT "lesson_receipt_version" CHECK(receipt_version=1),
	CONSTRAINT "lesson_receipt_json" CHECK(json_valid(receipt))
);
;
--> statement-breakpoint
CREATE INDEX `lesson_credit_owner_status` ON `lesson_credit` (`profile_id`,`generation`,`course_id`,`lesson_id`,`status`);
--> statement-breakpoint
CREATE INDEX `lesson_credit_package` ON `lesson_credit` (`package_hash`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_credit_lesson_credit_id_profile_id_generation_course_id_lesson_id_unique` ON `lesson_credit` (`lesson_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_credit_profile_id_generation_course_id_lesson_id_support_hash_unique` ON `lesson_credit` (`profile_id`,`generation`,`course_id`,`lesson_id`,`support_hash`);
--> statement-breakpoint
CREATE TABLE `lesson_credit_support` (
	`lesson_credit_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`task_id` text NOT NULL,
	`outcome` text NOT NULL,
	`task_credit_id` text NOT NULL,
	PRIMARY KEY(`lesson_credit_id`, `ordinal`),
	FOREIGN KEY (`lesson_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`) REFERENCES `lesson_credit`(`lesson_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`,`task_id`,`outcome`) REFERENCES `task_credit`(`credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`,`task_id`,`outcome`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "lesson_support_ordinal" CHECK(ordinal>=0),
	CONSTRAINT "lesson_support_outcome" CHECK(outcome IN ('completed','skipped'))
);
;
--> statement-breakpoint
CREATE INDEX `lesson_support_task_credit` ON `lesson_credit_support` (`task_credit_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_credit_support_lesson_credit_id_task_id_unique` ON `lesson_credit_support` (`lesson_credit_id`,`task_id`);
--> statement-breakpoint
CREATE TABLE `lesson_result` (
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`accepted_lesson_credit_id` text NOT NULL,
	PRIMARY KEY(`profile_id`, `generation`, `course_id`, `lesson_id`),
	FOREIGN KEY (`accepted_lesson_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`) REFERENCES `lesson_credit`(`lesson_credit_id`,`profile_id`,`generation`,`course_id`,`lesson_id`) ON UPDATE no action ON DELETE no action DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0)
);
;
--> statement-breakpoint
UPDATE installation SET database_version = 6;
