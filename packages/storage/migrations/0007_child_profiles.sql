CREATE TABLE `installation_profile_state` (
	`installation_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`selection_revision` integer NOT NULL,
	`preparation_hash` text,
	`initial_setup_mode` text NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `installation`(`installation_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "generation_nonnegative" CHECK(typeof(generation)='integer' AND generation>=0),
	CONSTRAINT "selection_revision_nonnegative" CHECK(typeof(selection_revision)='integer' AND selection_revision>=0),
	CONSTRAINT "preparation_hash_hash" CHECK(length(preparation_hash)=64 AND preparation_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "initial_setup_mode_supported" CHECK(initial_setup_mode IN ('firstLaunch','existingFamily','complete'))
);
--> statement-breakpoint
CREATE TABLE `profile_administration_receipt` (
	`installation_id` text NOT NULL,
	`command_id` text NOT NULL,
	`command_version` integer NOT NULL,
	`command` text NOT NULL,
	`expected_revision` integer NOT NULL,
	`resulting_revision` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`result_version` integer NOT NULL,
	`result` text NOT NULL,
	PRIMARY KEY(`installation_id`, `command_id`),
	FOREIGN KEY (`installation_id`) REFERENCES `installation`(`installation_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "expected_revision_nonnegative" CHECK(typeof(expected_revision)='integer' AND expected_revision>=0),
	CONSTRAINT "resulting_revision_nonnegative" CHECK(typeof(resulting_revision)='integer' AND resulting_revision>=0),
	CONSTRAINT "payload_hash_hash" CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "administration_command_version" CHECK(command_version=1),
	CONSTRAINT "administration_result_version" CHECK(result_version=1),
	CONSTRAINT "administration_command_json" CHECK(json_valid(command)),
	CONSTRAINT "administration_result_json" CHECK(json_valid(result)),
	CONSTRAINT "administration_revision_step" CHECK(resulting_revision=expected_revision+1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_administration_receipt_installation_id_resulting_revision_unique` ON `profile_administration_receipt` (`installation_id`,`resulting_revision`);
--> statement-breakpoint
UPDATE installation SET database_version = 8;
