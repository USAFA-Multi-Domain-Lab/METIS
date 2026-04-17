import type { TMigratableEffect } from '@metis/server/target-environments/TargetMigration'

/**
 * Builds a mock migratable effect for testing purposes.
 * @param version The starting version of the effect.
 * @param args The arguments in their pre-migration state.
 * @returns A new migratable effect object.
 */
export function buildMigratableEffect(
  version: string,
  args: Record<string, any>,
): TMigratableEffect {
  const effect: TMigratableEffect = {
    args,
    versionCursor: version,
    get result() {
      return { version: this.versionCursor, data: this.args }
    },
  } as TMigratableEffect
  return effect
}
