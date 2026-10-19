CREATE TABLE `installed_representation` (
	`package_hash` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`mode` text,
	`curriculum_utf8` blob,
	`preparation_utf8` blob,
	FOREIGN KEY (`package_hash`) REFERENCES `installed_package`(`package_hash`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "installed_representation_supported" CHECK((kind='development-v1' AND mode IS NULL AND curriculum_utf8 IS NULL AND preparation_utf8 IS NULL) OR (kind='signed-v1' AND mode IS NOT NULL AND mode IN ('fixture','publication') AND typeof(curriculum_utf8)='blob' AND length(curriculum_utf8)>0 AND typeof(preparation_utf8)='blob' AND length(preparation_utf8)>0))
);
--> statement-breakpoint
CREATE TABLE `installation_command` (
	`installation_id` text NOT NULL,
	`command_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`command_version` integer NOT NULL,
	`result_version` integer NOT NULL,
	`command` text NOT NULL,
	`stage` text NOT NULL,
	`result` text NOT NULL,
	`registered_package_hash` text,
	`activated_revision` integer,
	PRIMARY KEY(`installation_id`, `command_id`),
	FOREIGN KEY (`installation_id`) REFERENCES `installation`(`installation_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`registered_package_hash`) REFERENCES `installed_package`(`package_hash`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "installation_fact_stage" CHECK((stage='accepted' AND registered_package_hash IS NULL AND activated_revision IS NULL) OR (stage='readyInactive' AND registered_package_hash IS NOT NULL AND activated_revision IS NULL) OR (stage='activated' AND registered_package_hash IS NOT NULL AND activated_revision IS NOT NULL) OR (stage='rejected' AND activated_revision IS NULL)),
	CONSTRAINT "installation_versions" CHECK(command_version=1 AND result_version=1),
	CONSTRAINT "installation_revision" CHECK(activated_revision IS NULL OR (typeof(activated_revision)='integer' AND activated_revision>=0)),
	CONSTRAINT "installation_registered_mirror" CHECK(registered_package_hash IS json_extract(result,'$.registeredPackageHash') AND CAST(activated_revision AS TEXT) IS json_extract(result,'$.activationRevision')),
	CONSTRAINT "payload_hash_hash" CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT "installation_command_json" CHECK(json_valid(command)),
	CONSTRAINT "installation_result_json" CHECK(json_valid(result)),
	CONSTRAINT "installation_stage_supported" CHECK(stage IN ('accepted','readyInactive','activated','rejected')),
	CONSTRAINT "installation_command_mirrors" CHECK(coalesce(json_extract(command,'$.installationId')=installation_id AND json_extract(command,'$.commandId')=command_id AND json_extract(command,'$.version')=command_version AND json_extract(command,'$.kind')='initialInstall',0)),
	CONSTRAINT "installation_result_mirrors" CHECK(coalesce(json_extract(result,'$.installationId')=installation_id AND json_extract(result,'$.commandId')=command_id AND json_extract(result,'$.payloadHash')=payload_hash AND json_extract(result,'$.version')=result_version AND json_extract(result,'$.kind')=stage,0))
);
--> statement-breakpoint
INSERT INTO installed_representation(package_hash,kind) SELECT package_hash,'development-v1' FROM installed_package;
--> statement-breakpoint
UPDATE installation SET database_version = 13;
