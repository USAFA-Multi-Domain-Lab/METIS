# Target Env Conventions and Tips

Short, practical guidance for building METIS target environments. This focuses on loader behavior, naming rules, and common gotchas. For full references, see the links at the end.

## 📋 Quick Reference

| What        | Where                           | Filename    | Export            |
| ----------- | ------------------------------- | ----------- | ----------------- |
| Environment | `integration/target-env/<env>/` | `schema.ts` | `TargetEnvSchema` |
| Target      | `<env>/targets/<target>/`       | `schema.ts` | `TargetSchema`    |

> 🔄 **Important**: Folder names become permanent IDs. Plan carefully before deployment.

## 📂 Where things go

- Target environments live under: `integration/target-env/<env-folder>/`
- Each environment must have: `schema.ts` with a default export of `TargetEnvSchema`
- Targets live under: `<env-folder>/targets/` with any depth of subfolders
- A folder becomes a target only if it contains `schema.ts` with a default export of `TargetSchema`
- No manual registry needed: the server scans and discovers everything recursively

Minimal layout

```
integration/target-env/
  my-env/                      # kebab-case; folder name becomes env ID
    schema.ts                  # default export: TargetEnvSchema
    targets/
      output-panel/            # kebab-case; folder name becomes target ID
        schema.ts              # default export: TargetSchema
      admin/tools/cleanup/     # nested is allowed; cleanup is the target folder
        schema.ts
```

## 🏷️ IDs and naming

- All directories under `integration/target-env` are expected to be kebab-case (no exceptions)

- The folder name becomes the unique ID for the environment/target

  > Renaming a folder changes its ID; **plan migrations when renaming**

- Keep target folder names unique within an environment to avoid collisions

- Argument `_id` and `groupingId` can use any casing; they just need to be unique
  > We recommend using `camelCase` for argument IDs for easier extraction and usage in scripts. See [Target-Effect Conversion](target-effect-conversion.md) for more info.

## 📁 One target per folder

- Each target folder represents exactly one target
- Exactly one `schema.ts` per target folder, with a single default export of a `TargetSchema`
- Helpers (utils/components) can live alongside, but do not default-export another target

## 📄 Required filenames and exports

- The loader only recognizes `schema.ts`
- Environments: default export must be an instance of `TargetEnvSchema`
- Targets: default export must be an instance of `TargetSchema`

## 🛠️ Use the provided schema classes

Global constructors are available without imports:

- `TargetEnvSchema` - For defining target environments
- `TargetSchema` - For defining individual targets
- `TargetDependency` - For argument dependencies

Minimal examples

```ts
// integration/target-env/my-env/schema.ts

export default new TargetEnvSchema({
  name: 'My Environment',
  description: 'Example environment',
  version: '1.0.0',
})
```

```ts
// integration/target-env/my-env/targets/output-panel/schema.ts

export default new TargetSchema({
  name: 'Output Panel',
  description: 'Shows output in the panel',
  args: [
    /* ... */
  ],
  script: async (ctx) => {
    /* ... */
  },
})
```

## 🔍 Discovery behavior (how loading works)

- The server scans `integration/target-env/*` for environment folders
- It expects `schema.ts` at the env root and under each target folder (**_see folder structure above_**)
- It sets the environment/target IDs from their folder names
- It recursively descends subfolders of `targets/` and picks up any folder that has `schema.ts`
- If a folder has `schema.ts` but the default export isn't the correct schema class, it's skipped with a warning

## ⚙️ Dependencies and special argument types (quick notes)

- No hard limit on dependencies, but keep them simple and modular to avoid confusion
- `force`, `node`, `action`, and `files` are METIS-specific and auto-populate from the UI; use only for internal METIS operations
- For detailed argument behavior, see the [Argument Types](argument-types.md) guide

## ⚠️ Common gotchas

- Wrong filename: `schema.ts` is required; `index.ts` or others will not be discovered
- Multiple targets in one folder are not supported
- Putting `schema.ts` in a non-leaf folder makes that folder a target (ensure that's intended)
- Renaming folders changes IDs; **coordinate migrations for existing effects**

## ✅ Do / Don't

Do

- Use kebab-case for every directory under `integration/target-env`
- Keep folder names unique; treat them as stable IDs
- Use the provided schema classes and default exports

Don't

- Don't hand-register targets; discovery is automatic
- Don't hardcode IDs that can drift with folder renames
- Don't create deep, brittle dependency chains if a simpler layout will do

## ✔️ Validation

How to verify your setup works:

- Check console logs for "Successfully integrated [env-name]" messages
- Look for warnings about skipped schemas in the console
- Verify targets appear in the METIS UI
- Test target execution to ensure scripts run correctly

## 🔧 Troubleshooting

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

## 🚀 Next Steps

After reading this guide:

1. **Start with examples**: Read the [Basic Target Example](../examples/basic-target.md) for a complete walkthrough
2. **Learn argument types**: Review [Argument Types](argument-types.md) for UI component options
3. **Study existing patterns**: Explore `integration/target-env/metis/` for real-world examples
4. **Plan your structure**: Design your target organization before creating folders

## 📚 Related Documentation

### Guides

- **[Argument Types](argument-types.md)** - Complete reference for all METIS argument types and their usage
- **[Migrations](migrations.md)** - Handling schema changes and target environment migrations

### Examples

- **[Basic Target Example](../examples/basic-target.md)** - Simple target implementation walkthrough
- **[Complex Target Example](../examples/complex-target.md)** - Advanced patterns with dependencies and validation

### API Reference

- **[TargetEnvSchema Classes](../../../integration/library/target-env-classes)** - Core schema classes for target environments
- **[TargetSchema Classes](../../../integration/library/target-env-classes/targets)** - Schema classes for individual targets
