CREATE TABLE `removed_drawing` (
	`document_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `ink_document`(`document_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `storage_cleanup_receipt` (
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`command_id` text NOT NULL,
	`resulting_revision` integer NOT NULL,
	`command` text NOT NULL,
	`result` text NOT NULL,
	PRIMARY KEY(`profile_id`, `generation`, `command_id`),
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "resulting_revision_nonnegative" CHECK(typeof(resulting_revision)='integer' AND resulting_revision>=0),
	CONSTRAINT "cleanup_evidence" CHECK(json_valid(command) AND json_valid(result))
);
--> statement-breakpoint
CREATE INDEX `cleanup_receipt_revision` ON `storage_cleanup_receipt` (`profile_id`,`generation`,`resulting_revision`);
--> statement-breakpoint
CREATE TABLE `storage_cleanup_state` (
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`profile_id`, `generation`),
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0)
);
--> statement-breakpoint
UPDATE installation SET database_version = 15;
