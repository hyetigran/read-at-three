CREATE TABLE installed_package_v12 (package_hash TEXT PRIMARY KEY NOT NULL CHECK(length(package_hash)=64 AND package_hash NOT GLOB '*[^a-f0-9]*'), course_id TEXT NOT NULL, release_id TEXT NOT NULL, content_schema_version INTEGER NOT NULL CHECK(content_schema_version IN (1,2,3,4)), capabilities TEXT NOT NULL CHECK(json_valid(capabilities)), manifest_version INTEGER NOT NULL CHECK(manifest_version=1), verified_manifest BLOB NOT NULL CHECK(typeof(verified_manifest)='blob'), state TEXT NOT NULL CHECK(state IN ('staged','ready','missing','metadataOnly')), storage_key TEXT, UNIQUE(course_id,release_id), UNIQUE(package_hash,course_id), CHECK((state='ready' AND storage_key IS NOT NULL) OR (state='metadataOnly' AND storage_key IS NULL) OR state IN ('staged','missing')));
--> statement-breakpoint
INSERT INTO installed_package_v12 SELECT * FROM installed_package;
--> statement-breakpoint
DROP TABLE installed_package;
--> statement-breakpoint
ALTER TABLE installed_package_v12 RENAME TO installed_package;
--> statement-breakpoint
UPDATE installation SET database_version = 12;
