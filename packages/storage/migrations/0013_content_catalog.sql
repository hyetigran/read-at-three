CREATE TABLE `lesson_files_command` (
	`installation_id` text NOT NULL,
	`command_id` text NOT NULL,
	`command_version` integer NOT NULL,
	`command` text NOT NULL,
	`payload_hash` text NOT NULL,
	`result_version` integer NOT NULL,
	`stage` text NOT NULL,
	`result` text NOT NULL,
	`download_state` text,
	PRIMARY KEY(`installation_id`, `command_id`),
	FOREIGN KEY (`installation_id`) REFERENCES `installation`(`installation_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payload_hash_hash" CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "lesson_files_command_version" CHECK(command_version=1),
	CONSTRAINT "lesson_files_result_version" CHECK(result_version=1),
	CONSTRAINT "lesson_files_command_json" CHECK(json_valid(command)),
	CONSTRAINT "lesson_files_result_json" CHECK(json_valid(result)),
	CONSTRAINT "lesson_files_stage" CHECK(stage IN ('accepted','ready','activated','cancelled','rejected')),
	CONSTRAINT "lesson_files_download_state" CHECK(download_state IS NULL OR download_state IN ('pending','used','cancelled'))
);
--> statement-breakpoint
CREATE TABLE `package_hold` (
	`owner_kind` text NOT NULL,
	`owner_id` text NOT NULL,
	`package_hash` text NOT NULL,
	PRIMARY KEY(`owner_kind`, `owner_id`, `package_hash`),
	CONSTRAINT "package_hash_hash" CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "package_hold_owner_kind" CHECK(owner_kind IN ('pendingCommand','rollback','export','restore')),
	CONSTRAINT "package_hold_owner_id" CHECK(length(owner_id)>0 AND length(owner_id)<=4096 AND json_valid(owner_id))
);
--> statement-breakpoint
CREATE INDEX `package_hold_target` ON `package_hold` (`package_hash`);
--> statement-breakpoint
CREATE TABLE `package_collection` (
	`package_hash` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`state` text NOT NULL,
	CONSTRAINT "package_hash_hash" CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "package_collection_state" CHECK(state IN ('collecting','complete'))
);
--> statement-breakpoint
INSERT INTO package_hold(owner_kind,owner_id,package_hash) SELECT 'pendingCommand',json_array('initialInstall',installation_id,command_id),CASE WHEN stage='accepted' THEN json_extract(command,'$.target.publicationHash') ELSE registered_package_hash END FROM installation_command WHERE stage IN ('accepted','readyInactive');
--> statement-breakpoint
CREATE VIEW package_retention AS SELECT "active_package_hash" AS package_hash FROM "course_activation" WHERE "active_package_hash" IS NOT NULL UNION SELECT "fallback_package_hash" AS package_hash FROM "course_activation" WHERE "fallback_package_hash" IS NOT NULL UNION SELECT "package_hash" AS package_hash FROM "ink_document" WHERE "package_hash" IS NOT NULL UNION SELECT "registered_package_hash" AS package_hash FROM "installation_command" WHERE "registered_package_hash" IS NOT NULL AND stage='readyInactive' UNION SELECT "package_hash" AS package_hash FROM "lesson_credit" WHERE "package_hash" IS NOT NULL UNION SELECT "package_hash" AS package_hash FROM "package_hold" WHERE "package_hash" IS NOT NULL UNION SELECT "package_hash" AS package_hash FROM "session" WHERE "package_hash" IS NOT NULL UNION SELECT "package_hash" AS package_hash FROM "task_credit" WHERE "package_hash" IS NOT NULL UNION SELECT "package_hash" AS package_hash FROM "task_run" WHERE "package_hash" IS NOT NULL UNION SELECT p1.package_hash AS package_hash FROM "profile" AS p0 JOIN "task_run" AS p1 ON p0."undo_run_id"=p1."run_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" UNION SELECT p1.package_hash AS package_hash FROM "course_cursor" AS p0 JOIN "session" AS p1 ON p0."resume_session_id"=p1."session_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" AND p0."course_id"=p1."course_id" UNION SELECT p1.package_hash AS package_hash FROM "task_advance" AS p0 JOIN "task_run" AS p1 ON p0."run_id"=p1."run_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" UNION SELECT p1.package_hash AS package_hash FROM "advance_withdrawal" AS p0 JOIN "task_run" AS p1 ON p0."run_id"=p1."run_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" UNION SELECT p1.package_hash AS package_hash FROM "task_result" AS p0 JOIN "task_credit" AS p1 ON p0."accepted_credit_id"=p1."credit_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" AND p0."course_id"=p1."course_id" AND p0."lesson_id"=p1."lesson_id" AND p0."task_id"=p1."task_id" AND p0."outcome"=p1."outcome" UNION SELECT p1.package_hash AS package_hash FROM "ink_stroke" AS p0 JOIN "ink_document" AS p1 ON p0."document_id"=p1."document_id" UNION SELECT p2.package_hash AS package_hash FROM "ink_point_chunk" AS p0 JOIN "ink_stroke" AS p1 ON p0."stroke_id"=p1."stroke_id" JOIN "ink_document" AS p2 ON p1."document_id"=p2."document_id" UNION SELECT p1.package_hash AS package_hash FROM "ink_history" AS p0 JOIN "ink_document" AS p1 ON p0."document_id"=p1."document_id" UNION SELECT p2.package_hash AS package_hash FROM "ink_operation" AS p0 JOIN "ink_history" AS p1 ON p0."document_id"=p1."document_id" AND p0."layer"=p1."layer" JOIN "ink_document" AS p2 ON p1."document_id"=p2."document_id" UNION SELECT p2.package_hash AS package_hash FROM "ink_operation" AS p0 JOIN "ink_stroke" AS p1 ON p0."origin_stroke_id"=p1."stroke_id" AND p0."document_id"=p1."document_id" AND p0."layer"=p1."layer" JOIN "ink_document" AS p2 ON p1."document_id"=p2."document_id" UNION SELECT p1.package_hash AS package_hash FROM "lesson_credit_support" AS p0 JOIN "lesson_credit" AS p1 ON p0."lesson_credit_id"=p1."lesson_credit_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" AND p0."course_id"=p1."course_id" AND p0."lesson_id"=p1."lesson_id" UNION SELECT p1.package_hash AS package_hash FROM "lesson_credit_support" AS p0 JOIN "task_credit" AS p1 ON p0."task_credit_id"=p1."credit_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" AND p0."course_id"=p1."course_id" AND p0."lesson_id"=p1."lesson_id" AND p0."task_id"=p1."task_id" AND p0."outcome"=p1."outcome" UNION SELECT p1.package_hash AS package_hash FROM "lesson_result" AS p0 JOIN "lesson_credit" AS p1 ON p0."accepted_lesson_credit_id"=p1."lesson_credit_id" AND p0."profile_id"=p1."profile_id" AND p0."generation"=p1."generation" AND p0."course_id"=p1."course_id" AND p0."lesson_id"=p1."lesson_id";
--> statement-breakpoint
CREATE TRIGGER retention_advance_withdrawal_insert AFTER INSERT ON "advance_withdrawal" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_advance_withdrawal_update AFTER UPDATE ON "advance_withdrawal" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_command_receipt_insert AFTER INSERT ON "command_receipt" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_command_receipt_update AFTER UPDATE ON "command_receipt" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_course_activation_insert AFTER INSERT ON "course_activation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_course_activation_update AFTER UPDATE ON "course_activation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_course_cursor_insert AFTER INSERT ON "course_cursor" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_course_cursor_update AFTER UPDATE ON "course_cursor" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_document_insert AFTER INSERT ON "ink_document" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_document_update AFTER UPDATE ON "ink_document" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_history_insert AFTER INSERT ON "ink_history" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_history_update AFTER UPDATE ON "ink_history" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_operation_insert AFTER INSERT ON "ink_operation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_operation_update AFTER UPDATE ON "ink_operation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_point_chunk_insert AFTER INSERT ON "ink_point_chunk" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_point_chunk_update AFTER UPDATE ON "ink_point_chunk" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_stroke_insert AFTER INSERT ON "ink_stroke" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_ink_stroke_update AFTER UPDATE ON "ink_stroke" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_insert AFTER INSERT ON "installation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_update AFTER UPDATE ON "installation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_command_insert AFTER INSERT ON "installation_command" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_command_update AFTER UPDATE ON "installation_command" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_profile_state_insert AFTER INSERT ON "installation_profile_state" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installation_profile_state_update AFTER UPDATE ON "installation_profile_state" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installed_package_insert AFTER INSERT ON "installed_package" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installed_package_update AFTER UPDATE ON "installed_package" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installed_representation_insert AFTER INSERT ON "installed_representation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_installed_representation_update AFTER UPDATE ON "installed_representation" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_credit_insert AFTER INSERT ON "lesson_credit" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_credit_update AFTER UPDATE ON "lesson_credit" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_credit_support_insert AFTER INSERT ON "lesson_credit_support" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_credit_support_update AFTER UPDATE ON "lesson_credit_support" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_files_command_insert AFTER INSERT ON "lesson_files_command" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_files_command_update AFTER UPDATE ON "lesson_files_command" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_result_insert AFTER INSERT ON "lesson_result" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_lesson_result_update AFTER UPDATE ON "lesson_result" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_local_diagnostics_insert AFTER INSERT ON "local_diagnostics" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_local_diagnostics_update AFTER UPDATE ON "local_diagnostics" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_package_collection_insert AFTER INSERT ON "package_collection" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_package_collection_update AFTER UPDATE ON "package_collection" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_package_hold_insert AFTER INSERT ON "package_hold" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_package_hold_update AFTER UPDATE ON "package_hold" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_profile_insert AFTER INSERT ON "profile" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_profile_update AFTER UPDATE ON "profile" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_profile_administration_receipt_insert AFTER INSERT ON "profile_administration_receipt" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_profile_administration_receipt_update AFTER UPDATE ON "profile_administration_receipt" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_schema_migration_insert AFTER INSERT ON "schema_migration" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_schema_migration_update AFTER UPDATE ON "schema_migration" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_session_insert AFTER INSERT ON "session" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_session_update AFTER UPDATE ON "session" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_advance_insert AFTER INSERT ON "task_advance" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_advance_update AFTER UPDATE ON "task_advance" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_credit_insert AFTER INSERT ON "task_credit" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_credit_update AFTER UPDATE ON "task_credit" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_result_insert AFTER INSERT ON "task_result" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_result_update AFTER UPDATE ON "task_result" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_run_insert AFTER INSERT ON "task_run" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
CREATE TRIGGER retention_task_run_update AFTER UPDATE ON "task_run" WHEN EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting') BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END;
--> statement-breakpoint
UPDATE installation SET database_version = 14;
