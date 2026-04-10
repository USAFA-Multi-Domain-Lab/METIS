import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'
import type { TResourceMetadata } from '@shared/target-environments/types'

let migrations = new TargetMigrationRegistry()

// Migrates effects to be compatible with the new 'resource' arg
// added in v2.4.0 of METIS.
migrations.register('2.4.0', (effect) => {
  let firstResource = effect.mission.resources.sort(
    (resourceA, resourceB) => resourceA.order - resourceB.order,
  )[0]
  if (!firstResource) {
    throw new Error(
      `Migration failed. No resources found in the mission. ` +
        `A resource must be added to the mission before this migration can be applied.`,
    )
  }

  effect.args.resourceMetadata = {
    resourceId: firstResource._id,
    resourceName: firstResource.name,
  } satisfies TResourceMetadata
})

export { migrations }
