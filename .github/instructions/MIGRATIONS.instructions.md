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

// Query all relevant documents.
let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()

  // Transform doc...
  for (let force of mission.forces) {
    // Mutate nested arrays in place using for...of loops.
    for (let node of force.nodes) {
      for (let action of node.actions) {
        // Transform action fields here.
      }
    }
  }

  db.missions.updateOne(
    { _id: mission._id },
    { $set: { newField: value }, $unset: { someOldField: '' } },
  )
}

print('Migration complete.')
print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: NNNNNN } })
```

- **Always** end the script by updating `schemaBuildNumber` to the current build number.
- Prefer `$set` / `$unset` to avoid accidentally dropping unrelated fields.
- Use `db.collection.find({})` to get a cursor, then iterate with `while (cursor.hasNext()) { let doc = cursor.next() }`. **Never use `.forEach()` or `.map()` on cursors or nested mongosh document arrays** — these are not true JavaScript arrays and do not support those methods reliably in the mongosh shell.

### No Conditional Guards

Do not add conditional checks that detect whether data has already been migrated (e.g. `$exists` filters on the new field, or `Array.isArray` guards before transforming). A database build only runs when the recorded `schemaBuildNumber` is behind the current `SCHEMA_BUILD_NUMBER`, which guarantees the data is still in the previous build's shape. If the data is somehow malformed, an error is the correct and expected outcome — it surfaces a real problem rather than silently masking it.

### ID Generation

Mission documents use two distinct ID formats depending on nesting level:

- **Top-level `_id`** (the mission document itself) is a MongoDB `ObjectId` — never generate or overwrite these.
- **All embedded document `_id`s** (forces, nodes, actions, effects, resource pools, resource costs, etc.) are UUIDs.

When a migration must generate a new embedded document `_id`, use the `uuid` package's v4 function, following the convention established across the build scripts:

```js
const generateHash = require('uuid').v4

// Later, when creating an embedded document:
let embeddedDoc = {
  _id: generateHash(),
  // ...other fields
}
```

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

Import builds share the same numbering sequence as database builds. A given number represents the schema version a mission file must be transformed _to_ in order to be compatible. **The build number in the file should match the database build number introduced at the same time.**

### Writing an Import Build

```typescript
import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD NNNNNN --
// Brief description of what this build transforms.

const build: TMissionImportBuild = async (missionData) => {
  // Transform the raw JSON object in-place.
  // missionData is the parsed contents of a .metis file.

  missionData.newField = transformValue(missionData.oldField)
  delete missionData.oldField

  for (const force of missionData.forces) {
    for (const node of force.nodes) {
      for (const action of node.actions) {
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

export default build
```

- Mirror the exact same logic used in the corresponding database build script, since both transforms must produce the same end schema.

### No Conditional Guards

Do not add conditional checks that detect whether data has already been migrated (e.g. `Array.isArray` guards, `?? []` fallbacks, or `typeof` defensive checks). Import builds run sequentially in order against `.metis` file data, so a given build can always assume the data is in the shape produced by the previous build. If the data is malformed, an error is the correct and expected outcome.

### ID Generation

When an import build must generate a new embedded document `_id`, use `StringToolbox.generateRandomId()`, following the convention established across the import build scripts:

```typescript
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

// Later, when creating an embedded document:
let embeddedDoc = {
  _id: StringToolbox.generateRandomId(),
  // ...other fields
}
```

Note: the top-level mission `_id` is never generated inside import builds — it is always carried over from the existing file.

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
