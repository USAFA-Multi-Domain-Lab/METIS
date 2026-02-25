# Database Backups

METIS automatically backs up its MongoDB database using `mongodump`. This document explains how backups work, where they are stored, and how to restore one.

## How Backups Are Created

Backups are managed by `MetisDatabase.createBackup()` in `server/database/MetisDatabase.ts`. Two things trigger a backup automatically:

1. **On every server startup** — a backup is taken immediately after connecting to the database, before any schema migrations run.
2. **Every 24 hours** — a recurring interval runs while the server is active.

Automatic backups can be disabled by setting `DB_BACKUPS_ENABLED=false` in the environment configuration.

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
