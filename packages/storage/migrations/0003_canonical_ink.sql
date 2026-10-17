DROP INDEX receipt_owner_revision;
--> statement-breakpoint
ALTER TABLE command_receipt RENAME TO command_receipt_v3;
--> statement-breakpoint
CREATE TABLE command_receipt (scope_kind TEXT NOT NULL CHECK(scope_kind IN ('profile','session','document')), scope_id TEXT NOT NULL, scope_generation INTEGER NOT NULL CHECK(typeof(scope_generation)='integer' AND scope_generation>=0), command_id TEXT NOT NULL, owner_profile_id TEXT NOT NULL, owner_generation INTEGER NOT NULL CHECK(typeof(owner_generation)='integer' AND owner_generation>=0), expected_revision INTEGER NOT NULL CHECK(typeof(expected_revision)='integer' AND expected_revision>=0), resulting_revision INTEGER NOT NULL CHECK(typeof(resulting_revision)='integer' AND resulting_revision>=0), payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'), result_version INTEGER NOT NULL CHECK(result_version=1), result TEXT NOT NULL CHECK(json_valid(result)), PRIMARY KEY(scope_kind,scope_id,scope_generation,command_id), FOREIGN KEY(owner_profile_id,owner_generation) REFERENCES profile(profile_id,generation), CHECK(scope_generation=owner_generation));
--> statement-breakpoint
INSERT INTO command_receipt SELECT * FROM command_receipt_v3;
--> statement-breakpoint
DROP TABLE command_receipt_v3;
--> statement-breakpoint
CREATE INDEX receipt_owner_revision ON command_receipt(owner_profile_id,owner_generation,scope_kind,scope_id,resulting_revision);
--> statement-breakpoint
CREATE UNIQUE INDEX ink_run_owner ON task_run(run_id,profile_id,generation,course_id,package_hash,lesson_id,task_id);
--> statement-breakpoint
CREATE TABLE `ink_document` (
	`document_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`course_id` text NOT NULL,
	`package_hash` text NOT NULL,
	`lesson_id` text NOT NULL,
	`task_id` text NOT NULL,
	`target_id` text NOT NULL,
	`source_refs` text NOT NULL,
	`phase` text NOT NULL,
	`logical_width` real NOT NULL,
	`logical_height` real NOT NULL,
	`codec_version` integer NOT NULL,
	`revision` integer NOT NULL,
	`input_epoch` integer NOT NULL,
	`next_stroke_order` integer NOT NULL,
	FOREIGN KEY (`run_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`) REFERENCES `task_run`(`run_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ink_document_phase" CHECK(phase IN ('parentDemonstration','childTracing','childIndependentWriting')),
	CONSTRAINT "ink_document_geometry" CHECK(logical_width>0 AND logical_height>0 AND logical_width<=100000 AND logical_height<=100000),
	CONSTRAINT "ink_document_codec" CHECK(codec_version=1),
	CONSTRAINT "ink_document_source" CHECK(json_valid(source_refs)),
	CONSTRAINT "revision_nonnegative" CHECK(typeof(revision)='integer' AND revision>=0),
	CONSTRAINT "input_epoch_nonnegative" CHECK(typeof(input_epoch)='integer' AND input_epoch>=0),
	CONSTRAINT "next_stroke_order_nonnegative" CHECK(typeof(next_stroke_order)='integer' AND next_stroke_order>=0)
);
;
--> statement-breakpoint
CREATE INDEX `ink_document_package` ON `ink_document` (`package_hash`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_document_run_id_target_id_unique` ON `ink_document` (`run_id`,`target_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_document_document_id_run_id_profile_id_generation_course_id_package_hash_lesson_id_task_id_target_id_unique` ON `ink_document` (`document_id`,`run_id`,`profile_id`,`generation`,`course_id`,`package_hash`,`lesson_id`,`task_id`,`target_id`);
--> statement-breakpoint
CREATE TABLE `ink_stroke` (
	`stroke_id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`layer` text NOT NULL,
	`stroke_order` integer NOT NULL,
	`status` text NOT NULL,
	`codec_version` integer NOT NULL,
	`brush_version` integer NOT NULL,
	`brush` text NOT NULL,
	`point_count` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `ink_document`(`document_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ink_stroke_layer" CHECK(layer IN ('model','tracing','independent')),
	CONSTRAINT "ink_stroke_status" CHECK(status IN ('capturing','finished','interrupted')),
	CONSTRAINT "ink_stroke_versions" CHECK(codec_version=1 AND brush_version=1),
	CONSTRAINT "ink_stroke_brush" CHECK(json_valid(brush)),
	CONSTRAINT "ink_stroke_points" CHECK(typeof(point_count)='integer' AND point_count>=0 AND point_count<=100000 AND (status='capturing' OR point_count>0)),
	CONSTRAINT "stroke_order_nonnegative" CHECK(typeof(stroke_order)='integer' AND stroke_order>=0)
);
;
--> statement-breakpoint
CREATE INDEX `ink_stroke_document_layer` ON `ink_stroke` (`document_id`,`layer`,`stroke_order`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_one_capture` ON `ink_stroke` (`document_id`) WHERE status='capturing';
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_stroke_document_id_stroke_order_unique` ON `ink_stroke` (`document_id`,`stroke_order`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_stroke_stroke_id_document_id_layer_unique` ON `ink_stroke` (`stroke_id`,`document_id`,`layer`);
--> statement-breakpoint
CREATE TABLE `ink_point_chunk` (
	`stroke_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`first_point_index` integer NOT NULL,
	`point_count` integer NOT NULL,
	`codec_version` integer NOT NULL,
	`payload` blob NOT NULL,
	PRIMARY KEY(`stroke_id`, `chunk_index`),
	FOREIGN KEY (`stroke_id`) REFERENCES `ink_stroke`(`stroke_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ink_chunk_index" CHECK(typeof(chunk_index)='integer' AND typeof(first_point_index)='integer' AND chunk_index>=0 AND first_point_index>=0),
	CONSTRAINT "ink_chunk_points" CHECK(typeof(point_count)='integer' AND point_count>0 AND point_count<=2048),
	CONSTRAINT "ink_chunk_codec" CHECK(codec_version=1),
	CONSTRAINT "ink_chunk_bytes" CHECK(typeof(payload)='blob' AND length(payload)=point_count*16)
);
;
--> statement-breakpoint
CREATE TABLE `ink_history` (
	`document_id` text NOT NULL,
	`layer` text NOT NULL,
	`baseline_version` integer NOT NULL,
	`baseline` text NOT NULL,
	`base_seq` integer NOT NULL,
	`cursor_seq` integer NOT NULL,
	`tip_seq` integer NOT NULL,
	`next_op_seq` integer NOT NULL,
	PRIMARY KEY(`document_id`, `layer`),
	FOREIGN KEY (`document_id`) REFERENCES `ink_document`(`document_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ink_history_layer" CHECK(layer IN ('model','tracing','independent')),
	CONSTRAINT "ink_history_version" CHECK(baseline_version=1 AND json_valid(baseline)),
	CONSTRAINT "ink_history_sequence" CHECK(typeof(base_seq)='integer' AND typeof(cursor_seq)='integer' AND typeof(tip_seq)='integer' AND typeof(next_op_seq)='integer' AND base_seq>=0 AND cursor_seq>=base_seq AND tip_seq>=cursor_seq AND next_op_seq>tip_seq)
);
;
--> statement-breakpoint
CREATE TABLE `ink_operation` (
	`document_id` text NOT NULL,
	`layer` text NOT NULL,
	`seq` integer NOT NULL,
	`kind` text NOT NULL,
	`payload_version` integer NOT NULL,
	`payload` text NOT NULL,
	`origin_stroke_id` text,
	PRIMARY KEY(`document_id`, `layer`, `seq`),
	FOREIGN KEY (`document_id`,`layer`) REFERENCES `ink_history`(`document_id`,`layer`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`origin_stroke_id`,`document_id`,`layer`) REFERENCES `ink_stroke`(`stroke_id`,`document_id`,`layer`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ink_operation_seq" CHECK(typeof(seq)='integer' AND seq>0),
	CONSTRAINT "ink_operation_payload" CHECK(payload_version=1 AND json_valid(payload)),
	CONSTRAINT "ink_operation_origin" CHECK((kind='AddStroke' AND origin_stroke_id IS NOT NULL) OR (kind IN ('RemoveStroke','ReplaceModel','ClearPractice') AND origin_stroke_id IS NULL))
);
;
--> statement-breakpoint
CREATE UNIQUE INDEX `ink_unique_origin` ON `ink_operation` (`origin_stroke_id`) WHERE origin_stroke_id IS NOT NULL;
--> statement-breakpoint
UPDATE installation SET database_version=4;
