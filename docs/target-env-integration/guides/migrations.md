# Target Migrations

A target migration carries the arguments on existing effects across a change you made to your target's parameters between two versions of your environment. You write it because only you know the intent of the change — that `hostName` became `hostname`, or that a value should survive a type change. METIS cannot infer either.

## Table of Contents

- [Overview](#overview)
- [When a Migration Is Needed](#when-a-migration-is-needed)
- [The Migration Script](#the-migration-script)
  - [What an Argument Looks Like](#what-an-argument-looks-like)
  - [Renaming a Parameter](#renaming-a-parameter)
  - [Changing a Parameter's Type](#changing-a-parameters-type)
- [The Migration Registry](#the-migration-registry)
- [How Migrations Run](#how-migrations-run)
- [Reading Mission State](#reading-mission-state)
- [Complete Example](#complete-example)
- [Common Pitfalls](#common-pitfalls)
- [Related Documentation](#related-documentation)

## Overview

A migration is a function keyed to a target-environment version. It receives the effect and **mutates its arguments in place**. It returns nothing.

- **Registry** — a `TargetMigrationRegistry` holding every migration for one target
- **Version cursor** — where an effect currently sits, advanced as each migration runs
- **Chaining** — an effect several versions behind runs every migration between, in order
- **Validation** — the resulting arguments are schema-checked, so a malformed migration fails loudly
- **Manual trigger** — a mission author runs migrations from the mission page

## When a Migration Is Needed

Not every change to a parameter needs one. When an effect loads and no migration is pending for it, METIS reconciles its stored arguments against the target's current parameters and backfills anything missing — see [Reconciliation](target-effect-conversion.md#reconciliation-and-stale-arguments). Reconciliation is a repair pass, not a substitute for a migration: it knows what your parameters look like now, never what you renamed or how a value should carry across.

| Change to a parameter          | Migration needed?                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Renaming its `_id`             | **Yes.** Nothing links the old argument to the new parameter, so the value is orphaned and the parameter starts at its default |
| Changing its `type`            | **Only to keep the value.** Reconciliation supplies a fresh argument at the default; the old one is kept but ignored. A migration carries the value across |
| Adding a parameter             | No — a new argument is created at its default                                     |
| Removing a parameter           | No — the stored argument is ignored and left in place                              |
| Changing `default`             | No — existing arguments keep their stored values                                   |
| Changing `required`            | No — the default fills in on load if the value is still empty                       |
| Reordering `parameters`        | No — arguments are re-sorted to the declaration order                              |
| Editing `name` or `tooltipDescription` | No — neither is stored on the argument                                     |

The distinction to keep in mind: reconciliation protects the **target** from breaking, not the **author's data**. A rename loses the value silently, which is why it is the one case that always needs a migration.

## The Migration Script

```typescript
type TTargetMigrationScript = (effect: TMigratableEffect) => void
```

Two things follow from that signature:

- **Mutate `effect.arguments` in place.** A returned value is discarded.
- **`effect.arguments` is an array**, not an object keyed by parameter. Find the entry you want by its `parameterId`.

### What an Argument Looks Like

Each entry in `effect.arguments` is the stored form of one argument:

| Property      | Type                       | Notes                                                     |
| ------------- | -------------------------- | --------------------------------------------------------- |
| `_id`         | `string`                   | Identifies the argument entry itself                      |
| `parameterId` | `string`                   | The `_id` of the parameter it satisfies                    |
| `type`        | parameter type             | Must agree with `value` below                              |
| `value`       | depends on `type`          | `string` for text, `number \| null`, `boolean`, the option's value for a dropdown, or an array of serialized selections for `mission-component` |

Stale arguments are included, so an entry left behind by an earlier type change is visible to your migration too.

### Renaming a Parameter

The common case has a helper. `MigrationToolbox.updateParameterId` finds the argument and repoints it:

```typescript
import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

export const migrations = new TargetMigrationRegistry()

migrations.register('1.2.0', (effect) => {
  MigrationToolbox.updateParameterId(effect, 'hostName', 'hostname')
})
```

> **Note:** `updateParameterId` **throws** when no argument carries the old ID, which fails the whole migration. That is the right behavior for a parameter every effect had, but not for one added partway through the target's life. Guard first if some effects may never have had it.

```typescript
migrations.register('1.2.0', (effect) => {
  let existing = effect.arguments.find(
    (argument) => argument.parameterId === 'hostName',
  )
  if (existing) {
    MigrationToolbox.updateParameterId(effect, 'hostName', 'hostname')
  }
})
```

### Changing a Parameter's Type

Replace the entry rather than assigning to `type`, since `type` and `value` have to agree and the compiler ties them together:

```typescript
migrations.register('1.1.0', (effect) => {
  let index = effect.arguments.findIndex(
    (argument) => argument.parameterId === 'serverConfig',
  )
  let existing = effect.arguments[index]

  // Carry the text across from the single-line parameter to the multi-line one.
  if (existing && existing.type === 'string') {
    effect.arguments[index] = {
      _id: existing._id,
      parameterId: existing.parameterId,
      type: 'large-string',
      value: existing.value,
    }
  }
})
```

Without this migration nothing breaks — the author simply finds the field blank and has to retype what they had.

## The Migration Registry

One registry per target, imported by the target's schema. `register` returns the registry, so calls chain.

```typescript
import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

export const migrations = new TargetMigrationRegistry()
  .register('1.2.0', (effect) => {
    MigrationToolbox.updateParameterId(effect, 'hostName', 'hostname')
  })
  .register('2.0.0', (effect) => {
    MigrationToolbox.updateParameterId(effect, 'apiToken', 'token')
  })
```

Registration order does not matter — the registry keeps migrations sorted by version. A version string that is not valid semantic versioning throws as soon as it is registered, so a typo surfaces at server startup rather than during a migration.

Pass the registry to the target through `migrations`:

```typescript
import { migrations } from './migrations'

const DeployService = TargetSchema.create({
  _id: 'deploy-service',
  name: 'Deploy Service',
  description: 'Deploy a service to a remote server.',
  script: async (context, { notify, hostname }) => {
    context.sendOutput(`Deploying to ${hostname}`, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'hostname',
      name: 'Hostname',
      type: 'string',
      required: true,
      default: 'localhost',
    },
  ],
  migrations,
})

export default DeployService
```

The convention is a `migrations.ts` beside the target's `schema.ts`.

## How Migrations Run

An effect records the target-environment version it was built against. That becomes the **version cursor**, and every migration registered for a later version runs in ascending order, with the cursor advancing after each one.

| Effect built with | Current version | Migrations that run | Result |
| ----------------- | --------------- | ------------------- | ------ |
| v1.0.0            | v2.1.0          | `1.2.0`, then `2.0.0` | Compatible with v2.1.0 |
| v1.1.0            | v2.1.0          | `1.2.0`, then `2.0.0` | Compatible with v2.1.0 |
| v1.2.0            | v2.1.0          | `2.0.0` only         | Compatible with v2.1.0 |
| v2.0.0 or later   | v2.1.0          | none                 | Already compatible     |

Register a migration only for a version that actually needed one. Versions without a migration are skipped, and gaps bridge automatically. Releasing a new version of your environment does not by itself mark anything outdated — METIS flags an effect only when your target carries a migration registered for a version later than the effect's.

**Once all pending migrations have run, the resulting arguments are validated against the argument schema.** The check happens once, at the end of the chain, so an intermediate migration is free to leave arguments in a state a later one resolves. A migration that leaves a `value` disagreeing with its `type` — a `number` argument holding a string, say — throws, and nothing is applied: the effect keeps the arguments it had, including whatever an earlier migration in the chain had already changed. Failure is loud rather than silent.

A mission author starts this from the mission page: METIS reports the effect as outdated, and running the migration calls `POST /api/v1/target-environments/migrate/effect-args` with the mission and effect IDs. The response carries the migrated arguments, which the client applies to the effect. Until that happens the effect keeps its old arguments, and reconciliation is skipped so nothing overwrites data a migration is about to convert.

## Reading Mission State

The effect handed to a migration exposes the mission around it — `effect.mission`, `effect.host`, `effect.sourceForce`, `effect.sourceNode`, `effect.sourceAction`, `effect.target`, and `effect.environment`. A migration can therefore derive a new value from the mission rather than only from the old arguments.

```typescript
migrations.register('2.0.0', (effect) => {
  let existing = effect.arguments.find(
    (argument) => argument.parameterId === 'label',
  )

  // Fall back to the host component's name when the old label was blank.
  if (existing && existing.type === 'string' && existing.value === '') {
    existing.value = effect.host.name
  }
})
```

## Complete Example

Two versions of the same target, each with the migration its change required.

```typescript
// migrations.ts
import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import { MigrationToolbox } from '@metis/toolbox/migrations/MigrationToolbox'

export const migrations = new TargetMigrationRegistry()
  // v1.2.0 renamed `hostName` to `hostname`.
  .register('1.2.0', (effect) => {
    let existing = effect.arguments.find(
      (argument) => argument.parameterId === 'hostName',
    )
    if (existing) {
      MigrationToolbox.updateParameterId(effect, 'hostName', 'hostname')
    }
  })
  // v2.0.0 widened `notes` from a single line to a text area.
  .register('2.0.0', (effect) => {
    let index = effect.arguments.findIndex(
      (argument) => argument.parameterId === 'notes',
    )
    let existing = effect.arguments[index]

    if (existing && existing.type === 'string') {
      effect.arguments[index] = {
        _id: existing._id,
        parameterId: existing.parameterId,
        type: 'large-string',
        value: existing.value,
      }
    }
  })
```

## Common Pitfalls

| Pitfall                                                     | What happens                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Returning a new arguments object instead of mutating         | The return value is discarded and nothing changes                                                   |
| Treating `effect.arguments` as an object keyed by parameter  | It is an array. `effect.arguments.hostName` is `undefined`                                          |
| Calling `updateParameterId` for a parameter some effects never had | It throws, failing the whole migration. Guard with a `find` first                             |
| Leaving `type` and `value` disagreeing                       | Validation throws after the migration and the effect is left untouched                              |
| Registering a migration for every release                    | Only versions with a breaking change need one; the rest are skipped anyway                          |
| Registering a version string that is not semantic versioning | Throws at registration, so the server fails to load the target environment                          |
| Writing a migration to add a parameter or change a default   | Unnecessary — reconciliation already handles both                                                   |
| Renaming a parameter without a migration                     | Every existing effect silently loses that value and falls back to the default                       |

## Related Documentation

- **[Target-Effect Conversion](target-effect-conversion.md)** - Reconciliation, and what happens without a migration
- **[Parameter and Argument Types](parameter-and-argument-types.md)** - The parameter types a migration moves between
- **[Defining Targets](defining-targets.md)** - Where `migrations` attaches to a target
- **[Schemas Reference](../references/schemas.md)** - `TargetSchema` and `TargetEnvSchema` properties
- **[Creating Target Environments](creating-target-environments.md)** - Environment versioning
