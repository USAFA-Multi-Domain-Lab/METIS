# METIS: Migration Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for writing and registering database and import migrations in METIS.

## Overview

METIS has two parallel migration systems that sometimes need to be updated together:

1. **Database builds** — MongoDB shell scripts that migrate live data already stored in the database.
2. **Import builds** — TypeScript modules that migrate the JSON payload of `.metis` files being imported into the system at import-time.

The two systems share a build number sequence but serve different purposes. A database build transforms existing documents; an import build transforms incoming JSON before it is saved.

---

## 1. Database Builds

### Location

```
server/database/builds/build_NNNNNN.js
```

Build files are numbered sequentially with six zero-padded digits starting from `000001` (e.g. `build_000055.js`). They are plain MongoDB shell scripts run by `mongosh`.

### Writing a Database Build

Follow the pattern already established in the directory:

```js
// Brief comment describing what this migration does.

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Migrating ...')

// Query and update logic using db.collection here.
db.missions.find({ someOldField: { $exists: true } }).forEach((doc) => {
  // Transform doc...
  db.missions.updateOne(
    { _id: doc._id },
    { $set: { newField: value }, $unset: { someOldField: '' } },
  )
})

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: NNNNNN } })
```

- **Always** end the script by updating `schemaBuildNumber` to the current build number.
- Prefer `$set` / `$unset` to avoid accidentally dropping unrelated fields.
- Use `.forEach()` over cursor when transforming nested arrays (forces, nodes, actions).

### Registering the Build Number

After creating the build file, **increment `MetisServer.SCHEMA_BUILD_NUMBER`** in:

```
server/MetisServer.ts
```

```typescript
// Before
public static readonly SCHEMA_BUILD_NUMBER: number = 54

// After
public static readonly SCHEMA_BUILD_NUMBER: number = 55
```

This is the single source of truth the database checks against at server startup. If this value is ahead of what is recorded in the `infos` collection, the server will automatically run all outstanding build scripts via `mongosh` to bring the database up to date. **Forgetting to increment this value means the migration will never run.**

---

## 2. Import Builds

### When to Write an Import Build

Import builds are **only needed for changes to the mission model** (i.e. any change to the shape of data stored on `missions`, `forces`, `nodes`, `actions`, or `effects`). Other schema changes — user fields, session fields, access-control fields, etc. — do not require an import build because `.metis` files only contain mission data.

### Location

```
server/missions/imports/builds/build_NNNNNN.ts
```

Import builds share the same numbering sequence as database builds. A given number represents the schema version a mission file must be transformed _to_ in order to be compatible. The build number in the file should match the database build number introduced at the same time.

### Writing an Import Build

```typescript
import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD NNNNNN --
// Brief description of what this build transforms.

const build: TMissionImportBuild = async (missionData) => {
  // Transform the raw JSON object in-place.
  // missionData is the parsed contents of a .metis file.

  if (typeof missionData.oldField === 'string') {
    missionData.newField = transformValue(missionData.oldField)
    delete missionData.oldField
  }

  for (const force of missionData.forces ?? []) {
    for (const node of force.nodes ?? []) {
      for (const action of node.actions ?? []) {
        if (!Array.isArray(action.newArrayField)) {
          action.newArrayField = [
            {
              /* derived from old data */
            },
          ]
          delete action.oldField
        }
      }
    }
  }
}

export default build
```

- Guard all field accesses (`?? []`) — older files may be missing entire sections.
- Mirror the exact same logic used in the corresponding database build script, since both transforms must produce the same end schema.

### Registering an Import Build

After creating the file, register it in **two places** inside `MissionImport.ts`:

```
server/missions/imports/MissionImport.ts
```

1. Add an import at the top of the file alongside the other build imports:

```typescript
import build_000054 from './builds/build_000054'
```

2. Add a `processBuild` call inside the `applyBuilds` method, in ascending order:

```typescript
this.processBuild(missionData, 53, /****/ build_000053)
this.processBuild(missionData, 54, /****/ build_000054) // ← new line
```

**Both steps are required.** Omitting the `processBuild` call means the build is imported but never executed.

---

## 3. Checklist for a Complete Migration

Use this checklist whenever schema changes are made:

- [ ] Create `server/database/builds/build_NNNNNN.js` with the MongoDB migration script.
- [ ] Verify the script ends with `db.infos.updateOne({}, { $set: { schemaBuildNumber: NNNNNN } })`.
- [ ] Increment `MetisServer.SCHEMA_BUILD_NUMBER` in `server/MetisServer.ts`.
- [ ] **If the change affects the mission model:** Create `server/missions/imports/builds/build_NNNNNN.ts`.
- [ ] **If the change affects the mission model:** Add the import and `processBuild` call to `server/missions/imports/MissionImport.ts`.
- [ ] Update the Mongoose schema in `server/database/models/missions.ts` (or whichever model is affected).
- [ ] Update the shared TypeScript types in `shared/` to reflect the new shape.
- [ ] Run `npm test` and confirm all tests pass.
