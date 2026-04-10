---
agent: agent
description: Restore a specific database backup.
---

Restore the specified database backup by using the command found in `docs/devs/backups.md`. Backups are stored in `server/database/backups`. After this prompt, confirm with the user the backup that will be restored as well as the database that will be overwritten. Unless otherwise specified, the database to be restored should be the dev database defined in either the `dev.env` file or the `dev.defaults.env` file. `dev.env` takes precedence over `dev.defaults.env`, so prefer the database defined there if specified.
