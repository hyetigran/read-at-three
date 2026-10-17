ALTER TABLE task_run ADD COLUMN legacy_acceptance_seq_limit INTEGER NOT NULL DEFAULT 0 CHECK(typeof(legacy_acceptance_seq_limit)='integer' AND legacy_acceptance_seq_limit>=0);
--> statement-breakpoint
UPDATE task_run SET legacy_acceptance_seq_limit=next_advance_seq-1;
--> statement-breakpoint
CREATE TABLE `advance_withdrawal` (
	`advance_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`withdrawn_run_revision` integer NOT NULL,
	`command` text NOT NULL,
	FOREIGN KEY (`advance_id`,`run_id`) REFERENCES `task_advance`(`advance_id`,`run_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run_id`,`profile_id`,`generation`) REFERENCES `task_run`(`run_id`,`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "withdrawal_revision" CHECK(typeof(withdrawn_run_revision)='integer' AND withdrawn_run_revision>0),
	CONSTRAINT "withdrawal_command_json" CHECK(json_valid(command))
);
;
--> statement-breakpoint
CREATE UNIQUE INDEX `advance_withdrawal_run_id_withdrawn_run_revision_unique` ON `advance_withdrawal` (`run_id`,`withdrawn_run_revision`);
--> statement-breakpoint
UPDATE installation SET database_version = 7;
