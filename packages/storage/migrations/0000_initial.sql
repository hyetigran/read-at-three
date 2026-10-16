CREATE TABLE `command_receipt` (
	`scope_kind` text NOT NULL,
	`scope_id` text NOT NULL,
	`scope_generation` integer NOT NULL,
	`command_id` text NOT NULL,
	`owner_profile_id` text NOT NULL,
	`owner_generation` integer NOT NULL,
	`expected_revision` integer NOT NULL,
	`resulting_revision` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`result_version` integer NOT NULL,
	`result` text NOT NULL,
	PRIMARY KEY(`scope_kind`, `scope_id`, `scope_generation`, `command_id`),
	FOREIGN KEY (`owner_profile_id`,`owner_generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "receipt_scope" CHECK(scope_kind IN ('profile','session')),
	CONSTRAINT "scope_generation_nonnegative" CHECK(typeof(scope_generation)='integer' AND scope_generation>=0),
	CONSTRAINT "owner_generation_nonnegative" CHECK(typeof(owner_generation)='integer' AND owner_generation>=0),
	CONSTRAINT "expected_revision_nonnegative" CHECK(typeof(expected_revision)='integer' AND expected_revision>=0),
	CONSTRAINT "resulting_revision_nonnegative" CHECK(typeof(resulting_revision)='integer' AND resulting_revision>=0),
	CONSTRAINT "payload_hash_hash" CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "receipt_result_version" CHECK(result_version=1),
	CONSTRAINT "receipt_result_json" CHECK(json_valid(result)),
	CONSTRAINT "receipt_generation" CHECK(scope_generation=owner_generation)
);
--> statement-breakpoint
CREATE INDEX `receipt_owner_revision` ON `command_receipt` (`owner_profile_id`,`owner_generation`,`scope_kind`,`scope_id`,`resulting_revision`);--> statement-breakpoint
CREATE TABLE `course_activation` (
	`course_id` text PRIMARY KEY NOT NULL,
	`active_package_hash` text NOT NULL,
	`fallback_package_hash` text,
	`revision` integer NOT NULL,
	FOREIGN KEY (`active_package_hash`,`course_id`) REFERENCES `installed_package`(`package_hash`,`course_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fallback_package_hash`,`course_id`) REFERENCES `installed_package`(`package_hash`,`course_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0)
);
--> statement-breakpoint
CREATE TABLE `course_cursor` (
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`resume_session_id` text,
	`selection_counter` integer NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`profile_id`, `generation`, `course_id`),
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `course_activation`(`course_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "selection_counter_nonnegative" CHECK(typeof(selection_counter)='integer' AND selection_counter>=0),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0)
);
--> statement-breakpoint
CREATE TABLE `installation` (
	`installation_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`database_version` integer NOT NULL,
	`singleton` integer NOT NULL,
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "database_version_positive" CHECK(database_version>0),
	CONSTRAINT "installation_singleton" CHECK(singleton=1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `installation_singleton_unique` ON `installation` (`singleton`);--> statement-breakpoint
CREATE TABLE `installed_package` (
	`package_hash` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`release_id` text NOT NULL,
	`content_schema_version` integer NOT NULL,
	`capabilities` text NOT NULL,
	`manifest_version` integer NOT NULL,
	`verified_manifest` blob NOT NULL,
	`state` text NOT NULL,
	`storage_key` text,
	CONSTRAINT "package_hash_hash" CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "content_schema_version_supported" CHECK(content_schema_version=1),
	CONSTRAINT "capabilities_json" CHECK(json_valid(capabilities)),
	CONSTRAINT "manifest_version_supported" CHECK(manifest_version=1),
	CONSTRAINT "verified_manifest_bytes" CHECK(typeof(verified_manifest)='blob'),
	CONSTRAINT "package_state" CHECK(state IN ('staged','ready','missing','metadataOnly')),
	CONSTRAINT "package_storage" CHECK((state='ready' AND storage_key IS NOT NULL) OR (state='metadataOnly' AND storage_key IS NULL) OR state IN ('staged','missing'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `installed_package_course_id_release_id_unique` ON `installed_package` (`course_id`,`release_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `installed_package_package_hash_course_id_unique` ON `installed_package` (`package_hash`,`course_id`);--> statement-breakpoint
CREATE TABLE `profile` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`generation` integer NOT NULL,
	`revision` integer NOT NULL,
	`undo_run_id` text,
	`preferences_version` integer NOT NULL,
	`preferences` text NOT NULL,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "preferences_version_supported" CHECK(preferences_version=1),
	CONSTRAINT "preferences_json" CHECK(json_valid(preferences))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_profile_id_generation_unique` ON `profile` (`profile_id`,`generation`);--> statement-breakpoint
CREATE TABLE `schema_migration` (
	`version` integer PRIMARY KEY NOT NULL,
	`migration_id` text NOT NULL,
	`checksum` text NOT NULL,
	CONSTRAINT "version_positive" CHECK(version>0),
	CONSTRAINT "checksum_hash" CHECK(length(checksum)=64 AND checksum NOT GLOB '*[^a-f0-9]*')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schema_migration_migration_id_unique` ON `schema_migration` (`migration_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`session_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`package_hash` text NOT NULL,
	`lesson_id` text NOT NULL,
	`task_id` text NOT NULL,
	`current_run_id` text NOT NULL,
	`scope_kind` text NOT NULL,
	`scope_target_id` text NOT NULL,
	`status` text NOT NULL,
	`last_selected_seq` integer NOT NULL,
	`return_session_id` text,
	`revision` integer NOT NULL,
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`package_hash`,`course_id`) REFERENCES `installed_package`(`package_hash`,`course_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "last_selected_seq_nonnegative" CHECK(typeof(last_selected_seq)='integer' AND last_selected_seq>=0),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "session_scope_kind" CHECK(scope_kind IN ('progression','lessonReplay','taskReplay')),
	CONSTRAINT "session_status" CHECK(status IN ('active','paused','closed')),
	CONSTRAINT "session_return" CHECK(return_session_id IS NULL OR return_session_id!=session_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_one_active` ON `session` (`profile_id`,`generation`,`course_id`) WHERE status='active';--> statement-breakpoint
CREATE UNIQUE INDEX `session_one_live_scope` ON `session` (`profile_id`,`generation`,`course_id`,`scope_kind`,`scope_target_id`) WHERE status IN ('active','paused');--> statement-breakpoint
CREATE INDEX `session_owner_selection` ON `session` (`profile_id`,`generation`,`course_id`,`status`,`last_selected_seq`);--> statement-breakpoint
CREATE INDEX `session_package` ON `session` (`package_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_session_id_profile_id_generation_course_id_unique` ON `session` (`session_id`,`profile_id`,`generation`,`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_session_id_profile_id_generation_course_id_package_hash_lesson_id_unique` ON `session` (`session_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `task_advance` (
	`advance_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`seq` integer NOT NULL,
	`previous_advance_id` text,
	`status` text NOT NULL,
	`command_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`state_version` integer NOT NULL,
	`before_state` text NOT NULL,
	`after_state` text NOT NULL,
	`before_run_status` text NOT NULL,
	`after_run_status` text NOT NULL,
	`accepted_run_revision` integer NOT NULL,
	FOREIGN KEY (`run_id`,`profile_id`,`generation`) REFERENCES `task_run`(`run_id`,`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "accepted_run_revision_nonnegative" CHECK(typeof(accepted_run_revision)='integer' AND accepted_run_revision>=0),
	CONSTRAINT "advance_seq" CHECK(typeof(seq)='integer' AND seq>0),
	CONSTRAINT "advance_status" CHECK(status IN ('accepted','withdrawn')),
	CONSTRAINT "payload_hash_hash" CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "advance_state_version" CHECK(state_version=1),
	CONSTRAINT "advance_before_json" CHECK(json_valid(before_state)),
	CONSTRAINT "advance_after_json" CHECK(json_valid(after_state)),
	CONSTRAINT "advance_before_status" CHECK(before_run_status='inProgress'),
	CONSTRAINT "advance_after_status" CHECK(after_run_status IN ('inProgress','completed','skipped'))
);
--> statement-breakpoint
CREATE INDEX `task_advance_chain` ON `task_advance` (`run_id`,`seq`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_advance_run_id_seq_unique` ON `task_advance` (`run_id`,`seq`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_advance_advance_id_run_id_unique` ON `task_advance` (`advance_id`,`run_id`);--> statement-breakpoint
CREATE TABLE `task_run` (
	`run_id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`package_hash` text NOT NULL,
	`lesson_id` text NOT NULL,
	`task_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`status` text NOT NULL,
	`state_version` integer NOT NULL,
	`state` text NOT NULL,
	`active_advance_id` text,
	`next_advance_seq` integer NOT NULL,
	`revision` integer NOT NULL,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "ordinal_nonnegative" CHECK(typeof(ordinal)='integer' AND ordinal>=0),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "run_status" CHECK(status IN ('inProgress','completed','skipped','abandoned')),
	CONSTRAINT "run_state_version" CHECK(state_version=1),
	CONSTRAINT "run_state_json" CHECK(json_valid(state)),
	CONSTRAINT "run_next_advance" CHECK(typeof(next_advance_seq)='integer' AND next_advance_seq>0)
);
--> statement-breakpoint
CREATE INDEX `run_package` ON `task_run` (`package_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_run_session_id_ordinal_unique` ON `task_run` (`session_id`,`ordinal`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_run_run_id_profile_id_generation_unique` ON `task_run` (`run_id`,`profile_id`,`generation`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_run_run_id_session_id_profile_id_generation_course_id_package_hash_lesson_id_task_id_unique` ON `task_run` (`run_id`,`session_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`);