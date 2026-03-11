# METIS: Mission File Authoring Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for creating valid, importable METIS mission files by hand.

## Overview

METIS missions can be imported from a `.metis.zip` archive. When authoring a mission file manually — for testing, seeding, or sharing scenarios — several structural requirements must be satisfied before the file will pass import validation. This guide documents those requirements based on the Mongoose schema, the import validation logic, and lessons learned from real import failures.

---

## File Format

The import system validates the file extension against the `schemaBuildNumber`:

| `schemaBuildNumber` | Required Extension |
| ------------------- | ------------------ |
| ≤ 9                 | `.cesar`           |
| 10–39               | `.metis`           |
| ≥ 40                | `.metis.zip`       |

The current schema build number can be found in `server/MetisServer.ts` on the `SCHEMA_BUILD_NUMBER` property. As of the time of writing it is **54**, so all new mission files must be packaged as `.metis.zip`.

### ZIP Structure

```
your-mission_YYYYMMDD.metis.zip
├── data.json      # The mission JSON payload
└── files/         # Directory for any attached file references (may be empty)
```

To package a mission JSON file named `data.json`:

```bash
mkdir -p /tmp/mission-export/files
cp your-mission.json /tmp/mission-export/data.json
cd /tmp/mission-export
zip -r9 "/path/to/your-mission_YYYYMMDD.metis.zip" data.json files/
rm -rf /tmp/mission-export
```

---

## Required Top-Level Fields

The following top-level fields are required or important for import:

```json
{
  "name": "Mission Name",
  "versionNumber": 1,
  "schemaBuildNumber": 54,
  "resourceLabel": "Resources",
  "structure": { ... },
  "prototypes": [ ... ],
  "forces": [ ... ],
  "effects": [],
  "files": []
}
```

Fields that are **stripped during export** and must **not** be included (or will be ignored):

- `_id`
- `deleted`
- `createdAt`, `updatedAt`, `launchedAt`

---

## Prototype and Structure System

Every node in every force requires a `prototypeId` that matches a real entry in the top-level `prototypes` array. The `prototypes` array and `structure` object together define the mission's node hierarchy.

### The `prototypes` Array

Each prototype has the following shape:

```json
{
  "_id": "a-unique-uuid-v4-string",
  "structureKey": "another-unique-uuid-v4-string",
  "depthPadding": 0
}
```

- `_id` — Must be a unique UUID. This is what each node references in its `prototypeId` field.
- `structureKey` — Must be a unique UUID. This is the key used to represent this node in the `structure` tree.
- `depthPadding` — Visual indentation offset. Use `0` unless a specific indent is needed.

**Every node, including the root node, must have a corresponding entry in `prototypes`.** The string `"ROOT"` is a client-side runtime convention and is not a valid `prototypeId` for import.

### The `structure` Object

The `structure` object is a nested map of `structureKey` values that defines the parent-child hierarchy of nodes within each force. The top-level key is the root node's `structureKey`. Each value is either an empty object `{}` (leaf node) or a nested map of child structure keys.

```json
"structure": {
  "<root-structureKey>": {
    "<child-structureKey>": {
      "<grandchild-structureKey>": {}
    },
    "<another-child-structureKey>": {}
  }
}
```

### Generating Prototypes and Structure

When authoring a mission file with `n` nodes, generate `n` unique UUID pairs (`_id` + `structureKey`) — one pair per node. Use the `uuid` Python module or any UUID v4 generator. A straightforward script pattern:

```python
import uuid

nodes = [
  { "_id": "node-root", "name": "Root" },
  { "_id": "node-child-a", "name": "Child A", "parent": "node-root" },
  { "_id": "node-child-b", "name": "Child B", "parent": "node-root" },
]

proto_id_map = {}    # node _id -> prototype _id
struct_key_map = {}  # node _id -> structureKey

prototypes = []
for n in nodes:
    proto_id = str(uuid.uuid4())
    struct_key = str(uuid.uuid4())
    proto_id_map[n["_id"]] = proto_id
    struct_key_map[n["_id"]] = struct_key
    prototypes.append({ "_id": proto_id, "structureKey": struct_key, "depthPadding": 0 })
    n["prototypeId"] = proto_id

# Build structure tree recursively
children_map = {}
root_id = None
for n in nodes:
    parent = n.get("parent")
    if parent:
        children_map.setdefault(parent, []).append(n["_id"])
    else:
        root_id = n["_id"]

def build_structure(node_id):
    sk = struct_key_map[node_id]
    inner = {}
    for cid in children_map.get(node_id, []):
        inner.update(build_structure(cid))
    return {sk: inner}

structure = build_structure(root_id)
```

---

## Node Schema Requirements

The mission schema uses `strict: 'throw'` — any field not defined in the Mongoose schema causes a `StrictModeError` and the import is rejected.

### Required Node Fields

```json
{
  "_id": "unique-string-id",
  "localKey": "unique-string-key",
  "prototypeId": "uuid-matching-a-prototype-entry",
  "name": "Node Name",
  "color": "#52b1ff",
  "description": "",
  "preExecutionText": "",
  "executable": false,
  "device": false,
  "exclude": false,
  "initiallyBlocked": false,
  "actions": []
}
```

### Fields That Must NOT Be Included on Nodes

- `parentNodeId` — This is a client-side runtime field derived from the `structure` tree. It is not stored in the database and will cause a `StrictModeError` if present.

---

## Action Schema Requirements

### Required Action Fields

```json
{
  "_id": "unique-string-id",
  "localKey": "unique-string-key",
  "name": "Action Name",
  "description": "",
  "type": "repeatable",
  "processTime": 5000,
  "processTimeHidden": false,
  "successChance": 1,
  "successChanceHidden": false,
  "resourceCost": 0,
  "resourceCostHidden": false,
  "opensNode": false,
  "opensNodeHidden": false,
  "effects": []
}
```

The `type` field must be one of the values in `ServerMissionAction.TYPES`. Use `"repeatable"` as the default.

---

## Force Schema Requirements

### Required Force Fields

```json
{
  "_id": "unique-string-id",
  "localKey": "unique-string-key",
  "name": "Force Name",
  "color": "#34a1fb",
  "introMessage": "",
  "initialResources": 100,
  "revealAllNodes": false,
  "allowNegativeResources": false,
  "nodes": []
}
```

---

## Effect Schema Requirements

Effects can appear at the mission level (triggers: `session-setup`, `session-start`, `session-teardown`) or at the action level (triggers: `execution-initiation`, `execution-success`, `execution-failure`).

Each effect requires at minimum:

```json
{
  "_id": "unique-string-id",
  "localKey": "unique-string-key",
  "name": "Effect Name",
  "description": "",
  "trigger": "execution-success",
  "order": 0,
  "targetId": "target-environment-id",
  "environmentId": "environment-id",
  "targetEnvironmentVersion": "0.1.0",
  "args": {}
}
```

### Effect Args Requirements

The `args` object is validated at runtime against the target's arg schema. There are two rules that commonly cause issues when authoring `args` by hand:

**1. All boolean toggles must be present, even unused ones.**

Every `boolean`-type arg in the target's schema is treated as always required, because a boolean always has a defined value (`true` or `false`). The issue detector flags any boolean arg whose dependencies are met but whose key is absent from `args`. This means the `args` object for every effect must include **all boolean toggle args** for that target — those not being used should be set to `false`.

For example, a MACE Air effect that only sets heading must still include all other boolean toggles:

```json
"args": {
  "callsign": "AH-64_1",
  "headingToggle": true,
  "heading": 270,
  "speedToggle": false,
  "altitudeToggle": false,
  "healthToggle": false,
  "landingZoneToggle": false,
  "reactionToggle": false,
  "locationToggle": false,
  "trailToggle": false,
  "tdlToggle": false,
  "loiterToggle": false,
  "equipmentToggle": false,
  "weaponsToggle": false,
  "weaponsPostureToggle": false,
  "deleteEntity": false
}
```

**2. Args whose dependencies are not met must not be present.**

If an arg's dependencies are not satisfied, it must be absent from `args` entirely. Including it when its dependencies aren't met triggers a dependency-alignment issue. This is the inverse of rule 1: boolean toggles are always required because their dependencies (typically just a valid callsign) are always met; conditional args that depend on a specific dropdown selection must only be present when that condition holds.

A common example is `equipmentCategory` in MACE targets. It depends on `equipmentOperation` being `enable` or `disable`. When the operation is `add` or `remove`, `equipmentCategory` must **not** be in `args`:

```json
"args": {
  "callsign": "AH-64_1",
  "equipmentToggle": true,
  "equipmentOperation": "add",
  "equipmentName": "AIM-9M Sidewinder"
  // ✗ Do NOT include "equipmentCategory" here — its dependencies are not met
}
```

Similarly, `weaponsChargeType` (and its dependent `weaponsChargeName`) must only be present when `weaponsOperation` is `fire`. When `weaponsOperation` is `fire` and `weaponsChargeType` is absent, it is flagged as a missing required arg — use `"none"` for non-indirect-fire weapons:

```json
"args": {
  "callsign": "AH-64_1",
  "weaponsToggle": true,
  "weaponsOperation": "fire",
  "weaponsName": "AGM-114 HELLFIRE",
  "weaponsTargetCallsign": "Ka-50_1",
  "weaponsChargeType": "none"
}
```

---

## Common Import Errors and Fixes

| Error                                                                | Cause                                                                  | Fix                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Path prototypeId is required`                                       | Node has an empty or missing `prototypeId`                             | Generate a UUID and add a matching entry to `prototypes`                          |
| `Prototype ID "ROOT" ... does not exist in the mission's prototypes` | Root node used the string `"ROOT"` as `prototypeId`                    | The root node needs a real UUID prototype entry just like all other nodes         |
| `StrictModeError` on `parentNodeId`                                  | Node has a `parentNodeId` field which is not in the schema             | Remove `parentNodeId` from all nodes; hierarchy is encoded in `structure`         |
| `Cast to embedded failed ... StrictModeError`                        | A field present on the node/action/force is not in the Mongoose schema | Remove any client-side-only fields before packaging                               |
| `Structure key "..." is missing`                                     | A prototype's `structureKey` does not appear in the `structure` tree   | Ensure every non-root prototype's `structureKey` appears somewhere in `structure` |
| Wrong file extension on import                                       | `schemaBuildNumber` ≥ 40 but file is `.metis` or `.json`               | Package as `.metis.zip` with the `data.json` + `files/` structure                 |
| Effect issue: "argument that doesn't belong"                         | An arg is present in `args` but its dependencies are not met           | Remove the arg; it must be absent when its dependency condition is not satisfied  |
| Effect issue: required argument missing                              | A boolean toggle arg is absent from `args`                             | Add all boolean toggle args for the target, setting unused ones to `false`        |
| Effect issue: required argument missing (`weaponsChargeType`)        | `weaponsOperation` is `fire` but `weaponsChargeType` is not in `args`  | Add `"weaponsChargeType": "none"` (or the appropriate charge type)                |
