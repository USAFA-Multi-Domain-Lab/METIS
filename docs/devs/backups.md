# Database Backups

METIS automatically backs up its MongoDB database using `mongodump`. This document explains how backups work, where they are stored, how to restore one, and what happens when a schema migration is interrupted.

## Table of Contents

- [How Backups Are Created](#how-backups-are-created)
- [Where Backups Are Stored](#where-backups-are-stored)
- [Restoring a Backup](#restoring-a-backup)
  - [Verifying the Restore](#verifying-the-restore)
- [Interrupted Migrations](#interrupted-migrations)
  - [What the Server Does](#what-the-server-does)
- [Related Documentation](#related-documentation)

## How Backups Are Created

Backups are managed by `MetisDatabase.createBackup()` in `server/database/MetisDatabase.ts`. Two things trigger a backup automatically:

1. **On every server startup** — after connecting to the database and before any schema migrations run.
2. **Every 24 hours** — a recurring interval runs while the server is active.

On startup the order is deliberate: the server first checks whether a previous migration was left unfinished, and only then takes the backup. That way a halted startup never snapshots a half-migrated database on top of a good backup.

Automatic backups can be disabled by setting `DB_BACKUPS_ENABLED=false` in the environment configuration. Doing so also removes the safety net described in [Interrupted Migrations](#interrupted-migrations).

> **Nothing removes old backups.** There is no retention limit or pruning, so the backup directory grows by one snapshot per startup plus one per day the server stays up. Housekeeping is the operator's responsibility.

## Where Backups Are Stored

All backups are written to:

```text
server/database/backups/
```

Each backup is a subdirectory containing one folder per database (named after the configured database), which in turn holds the `.bson` data files and `.metadata.json` index files for each collection.

### Directory Naming Conventions

| Format                                   | Description                          |
| ---------------------------------------- | ------------------------------------ |
| `<YYYY-MM-DDTHH-MM-SS>/<database-name>/` | Automatic backup, named by timestamp |

Backup directory names are generated automatically from the timestamp at the time the backup was created.

## Restoring a Backup

Use `mongorestore` with the `--drop` flag to restore a backup. The `--drop` flag drops each collection before restoring it, ensuring no stale documents remain.

```bash
mongorestore --drop --db <database-name> server/database/backups/<YYYY-MM-DDTHH-MM-SS>/<database-name>
```

> **Note:** The path passed to `mongorestore` must point to the inner database folder (`<backup-date>/<database-name>`), not the backup root itself.

### Verifying the Restore

After running the command, the output will report documents restored and failures per collection. A successful restore looks like:

```text
269 document(s) restored successfully. 0 document(s) failed to restore.
```

## Interrupted Migrations

A schema migration that starts but never finishes leaves the database partially converted — some collections on the new shape, some on the old. METIS treats that as unsafe to run against, and refuses to start until it is resolved.

### What the Server Does

Before each schema build runs, the server records two things on the info document: the build number it is migrating to, and the path of the backup taken moments earlier. Both are cleared when the build completes.

On the next startup, that flag is checked before anything else touches the data:

- **No flag** — the database sits on a clean build boundary, and startup continues.
- **A flag for a build the database never reached** — the migration was interrupted. Startup **halts** with an error naming the build number.

When startup halts, the operator gets the reason and a ready-to-run restore command on both the console and the database log, built from the recorded backup path and the server's own connection settings:

```text
=============== DATABASE MIGRATION INCOMPLETE ===============
A previous migration to schema build 45 did not finish, so
the database may be partially converted. The server will not start
until it is restored to its pre-migration state.

A backup was taken immediately before the migration began:
  server/database/backups/2025-07-15T10-30-00

To restore it, run:
  mongorestore --drop --host localhost --port 27017 --db metis server/database/backups/2025-07-15T10-30-00/metis

After restoring, restart the server and the migration will run again
from a clean state.
```

> **Note:** If backups were disabled, no path was recorded and the message says so, directing you to your own most recent pre-migration backup instead.

## Related Documentation

- **[Architecture](architecture.md)** - Where the database sits in the wider system
- **[Environment Configuration](../setup/environment.md)** - `DB_BACKUPS_ENABLED` and the other server settings
- **[Setup Instructions](../setup/index.md)** - Installing and running the server
