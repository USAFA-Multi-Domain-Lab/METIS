import type { TMigratableEffect } from '@metis/server/target-environments/TargetMigration'
import type { TTargetArgumentJson } from '@shared/target-environments/arguments/TargetArgument'

/**
 * Builds a mock migratable effect for testing purposes.
 * @param version The starting version of the effect.
 * @param arguments The arguments in their pre-migration state.
 * @returns A new migratable effect object.
 */
export function buildMigratableEffect(
  version: string,
  targetArguments: TTargetArgumentJson[],
): TMigratableEffect {
  const effect: TMigratableEffect = {
    arguments: targetArguments,
    versionCursor: version,
    get result() {
      return {
        version: this.versionCursor,
        data: structuredClone(this.arguments),
      }
    },
  } as TMigratableEffect
  return effect
}
