ALTER TABLE installation_profile_state RENAME TO installation_profile_state_v8;
--> statement-breakpoint
DROP INDEX profile_administration_receipt_installation_id_resulting_revision_unique;
--> statement-breakpoint
ALTER TABLE profile_administration_receipt RENAME TO profile_administration_receipt_v8;
--> statement-breakpoint
DROP INDEX receipt_owner_revision;
--> statement-breakpoint
ALTER TABLE command_receipt RENAME TO command_receipt_v8;
--> statement-breakpoint
CREATE TABLE `installation_profile_state` (
	`installation_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`generation` integer NOT NULL,
	`selection_revision` integer NOT NULL,
	`preparation_hash` text,
	`initial_setup_mode` text NOT NULL,
	FOREIGN KEY (`installation_id`) REFERENCES `installation`(`installation_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`,`generation`) REFERENCES `profile`(`profile_id`,`generation`) ON UPDATE no action ON DELETE no action DEFERRABLE INITIALLY DEFERRED,
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
	`evidence_kind` text DEFAULT 'full' NOT NULL,
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
	CONSTRAINT "administration_command_version" CHECK(command_version IN (1,2)),
	CONSTRAINT "administration_result_version" CHECK(result_version IN (1,2)),
	CONSTRAINT "administration_evidence_kind" CHECK(evidence_kind IN ('full','retired','deleted')),
	CONSTRAINT "administration_command_json" CHECK(json_valid(command)),
	CONSTRAINT "administration_result_json" CHECK(json_valid(result)),
	CONSTRAINT "administration_revision_step" CHECK(resulting_revision=expected_revision+1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_administration_receipt_installation_id_resulting_revision_unique` ON `profile_administration_receipt` (`installation_id`,`resulting_revision`);
--> statement-breakpoint
CREATE TABLE `local_diagnostics` (
	`singleton` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	CONSTRAINT "diagnostics_singleton" CHECK(singleton=1),
	CONSTRAINT "diagnostics_json" CHECK(json_valid(payload)),
	CONSTRAINT "diagnostics_bytes" CHECK(length(CAST(payload AS BLOB))<=1048576)
);
--> statement-breakpoint
CREATE TABLE command_receipt (scope_kind TEXT NOT NULL CHECK(scope_kind IN ('profile','session','document')), scope_id TEXT NOT NULL, scope_generation INTEGER NOT NULL CHECK(typeof(scope_generation)='integer' AND scope_generation>=0), command_id TEXT NOT NULL, owner_profile_id TEXT NOT NULL, owner_generation INTEGER NOT NULL CHECK(typeof(owner_generation)='integer' AND owner_generation>=0), expected_revision INTEGER NOT NULL CHECK(typeof(expected_revision)='integer' AND expected_revision>=0), resulting_revision INTEGER NOT NULL CHECK(typeof(resulting_revision)='integer' AND resulting_revision>=0), payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'), result_version INTEGER NOT NULL CHECK(result_version=1 OR (result_version=2 AND scope_kind='profile')), result TEXT NOT NULL CHECK(json_valid(result)), PRIMARY KEY(scope_kind,scope_id,scope_generation,command_id), FOREIGN KEY(owner_profile_id,owner_generation) REFERENCES profile(profile_id,generation), CHECK(scope_generation=owner_generation));
--> statement-breakpoint
INSERT INTO installation_profile_state SELECT * FROM installation_profile_state_v8;
--> statement-breakpoint
INSERT INTO profile_administration_receipt(installation_id,command_id,command_version,command,expected_revision,resulting_revision,payload_hash,result_version,result,evidence_kind) SELECT installation_id,command_id,command_version,command,expected_revision,resulting_revision,payload_hash,result_version,result,'full' FROM profile_administration_receipt_v8;
--> statement-breakpoint
INSERT INTO command_receipt SELECT * FROM command_receipt_v8;
--> statement-breakpoint
DROP TABLE installation_profile_state_v8;
--> statement-breakpoint
DROP TABLE profile_administration_receipt_v8;
--> statement-breakpoint
DROP TABLE command_receipt_v8;
--> statement-breakpoint
CREATE INDEX receipt_owner_revision ON command_receipt(owner_profile_id,owner_generation,scope_kind,scope_id,resulting_revision);
--> statement-breakpoint
UPDATE installation SET database_version = 9;
