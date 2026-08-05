# Target Environment Conventions and Tips

Short, practical guidance for building METIS target environments. This focuses on loader behavior, naming rules, and common gotchas. For full references, see the links at the end.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Where Things Go](#where-things-go)
- [IDs and Naming](#ids-and-naming)
- [One Target Per Folder](#one-target-per-folder)
- [Required Filenames and Exports](#required-filenames-and-exports)
- [Use the Provided Schema Classes](#use-the-provided-schema-classes)
- [Discovery Behavior](#discovery-behavior)
- [Dependencies and Component Selection](#dependencies-and-component-selection)
- [Common Gotchas](#common-gotchas)
- [Do and Don't](#do-and-dont)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)
- [Related Documentation](#related-documentation)

## Quick Reference

| What        | Where                           | Filename    | Export            |
| ----------- | ------------------------------- | ----------- | ----------------- |
| Environment | `integration/target-env/<env>/` | `schema.ts` | `TargetEnvSchema` |
| Target      | `<env>/targets/<target>/`       | `schema.ts` | `TargetSchema`    |

> **Important**: An environment's folder name becomes its permanent ID. A target's `_id` is declared in its schema and is independent of its folder. Plan both carefully before deployment.

## Where Things Go

- Target environments live under: `integration/target-env/<env-folder>/`
- Each environment must have: `schema.ts` with a default export of `TargetEnvSchema`
- Targets live under: `<env-folder>/targets/` with any depth of subfolders
- A folder becomes a target only if it contains `schema.ts` with a default export of `TargetSchema`
- No manual registry needed: the server scans and discovers everything recursively

Minimal layout

```text
integration/target-env/
  my-env/                      # kebab-case; folder name becomes env ID
    schema.ts                  # default export: TargetEnvSchema
    targets/
      output-panel/            # kebab-case; folder name becomes target ID
        schema.ts              # default export: TargetSchema
      admin/tools/cleanup/     # nested is allowed; cleanup is the target folder
        schema.ts
```

## IDs and Naming

- All directories under `integration/target-env` are expected to be kebab-case (no exceptions)

- **An environment's folder name becomes its ID.** Renaming the folder changes the ID, which orphans every effect built from that environment

- **A target's ID does not come from its folder.** Declare `_id` on the schema; it is required. Folders under `targets/` organize your files and nothing more, so you can rename or nest them freely

  > Changing a target's declared `_id` is the change that orphans effects; **plan a migration when renaming one**

- Keep target `_id` values unique within an environment to avoid collisions

- Parameter `_id` and `groupingId` can use any casing; they just need to be unique
  > We recommend `camelCase` for parameter IDs so scripts can destructure them without quoting. See [Target-Effect Conversion](target-effect-conversion.md) for more info.

## One Target Per Folder

- Each target folder represents exactly one target
- Exactly one `schema.ts` per target folder, with a single default export of a `TargetSchema`
- Helpers (utils/components) can live alongside, but do not default-export another target

## Required Filenames and Exports

- The loader only recognizes `schema.ts`
- Environments: default export must be an instance of `TargetEnvSchema`
- Targets: default export must be an instance of `TargetSchema`

## Use the provided schema classes

Global constructors are available without imports:

- `TargetEnvSchema` - For defining target environments
- `TargetSchema` - For defining individual targets
- `TargetDependency` - For parameter dependencies

Minimal examples

```typescript
// integration/target-env/my-env/schema.ts

export default new TargetEnvSchema({
  name: 'My Environment',
  description: 'Example environment',
  version: '1.0.0',
})
```

```typescript
// integration/target-env/my-env/targets/output-panel/schema.ts

const OutputPanel = TargetSchema.create({
  _id: 'output-panel',
  name: 'Output Panel',
  description: 'Shows output in the panel',
  script: async (context, { notify, message }) => {
    context.sendOutput(message, notify)
  },
  parameters: [
    {
      _id: 'notify',
      name: 'Notify',
      type: 'mission-component',
      validComponentTypes: ['mission', 'force'],
    },
    {
      _id: 'message',
      name: 'Message',
      type: 'string',
      required: true,
      default: 'Enter a message.',
    },
  ],
})

export default OutputPanel
```

## Discovery Behavior

- The server scans `integration/target-env/*` for environment folders
- It expects `schema.ts` at the env root and under each target folder (**_see folder structure above_**)
- It sets each environment's ID from its folder name; each target's ID comes from the `_id` on its schema
- It recursively descends subfolders of `targets/` and picks up any folder that has `schema.ts`
- If a folder has `schema.ts` but the default export isn't the correct schema class, it's skipped with a warning

## Dependencies and Component Selection

- No hard limit on dependencies, but keep them simple and modular to avoid confusion
- `mission-component` is the parameter type for selecting things inside the mission — the mission, forces, nodes, actions, files, resources, and resource pools. Narrow what is selectable with `validComponentTypes`
- For detailed argument behavior, see the [Parameter and Argument Types](parameter-and-argument-types.md) guide

## Common Gotchas

- Wrong filename: `schema.ts` is required; `index.ts` or others will not be discovered
- Multiple targets in one folder are not supported
- Putting `schema.ts` in a non-leaf folder makes that folder a target (ensure that's intended)
- Renaming an environment folder changes its ID;
- Renaming a target folder changes nothing — but changing its declared `_id` orphans existing effects **coordinate migrations for existing effects**

## Do and Don't

Do

- Use kebab-case for every directory under `integration/target-env`
- Keep environment folder names unique and stable; they are IDs
- Use the provided schema classes and default exports

Don't

- Don't hand-register targets; discovery is automatic
- Don't change a target's `_id` casually; it is the link between the target and every effect built from it
- Don't create deep, brittle dependency chains if a simpler layout will do

## Validation

How to verify your setup works:

- Check console logs for `Successfully integrated "<environment-name>" with METIS.`
- Look for warnings about skipped schemas in the console
- Verify targets appear in the METIS UI
- Test target execution to ensure scripts run correctly

## Troubleshooting

**Target not appearing in UI?**

- Check filename is exactly `schema.ts` (case-sensitive)
- Verify default export is correct schema class instance
- Look for server console warnings about skipped targets

**Build/import errors?**

- Verify import paths match your project structure
- Ensure schema classes are properly imported
- Check for TypeScript compilation errors

**ID conflicts or unexpected behavior?**

- Ensure folder names are unique within environment
- Verify no accidental `schema.ts` files in parent directories
- Check for special characters in folder names (use kebab-case only)

## Next Steps

After reading this guide:

1. **Start with examples**: Read the [Basic Target Example](../examples/basic-target.md) for a complete walkthrough
2. **Learn argument types**: Review [Parameter and Argument Types](parameter-and-argument-types.md) for UI component options
3. **Study existing patterns**: Explore `integration/target-env/metis/` for real-world examples
4. **Plan your structure**: Design your target organization before creating folders

## Related Documentation

### Guides

- **[Parameter and Argument Types](parameter-and-argument-types.md)** - Complete reference for all METIS argument types and their usage
- **[Migrations](migrations.md)** - Handling schema changes and target environment migrations

### Examples

- **[Basic Target Example](../examples/basic-target.md)** - Simple target implementation walkthrough
- **[Complex Target Example](../examples/complex-target.md)** - Advanced patterns with dependencies and validation

### References

- **[Schemas Reference](../references/schemas.md)** - Every property on `TargetSchema` and `TargetEnvSchema`
- **[Context API Reference](../references/context-api.md)** - What a target script can do at runtime
