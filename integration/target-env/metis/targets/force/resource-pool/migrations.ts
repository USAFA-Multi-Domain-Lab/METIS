import { TargetMigrationRegistry } from '@metis/schema/TargetMigrationRegistry'

type TLegacyForceMetadata = { forceKey?: string; forceName?: string }
type TLegacyPoolMetadata = {
  forceKey?: string
  forceName?: string
  poolKey?: string
  poolName?: string
}

let migrations = new TargetMigrationRegistry()

// Migrates awards to be compatible with new multi-resource
// system added in v2.4.0 of METIS.
migrations.register('2.4.0', (effect) => {
  let { forceKey, forceName } = effect.arguments
    .forceMetadata as TLegacyForceMetadata

  // Find force
  let force: typeof effect.sourceForce | undefined = effect.sourceForce // Default to source force.
  if (forceKey !== 'self') {
    force = effect.mission.forces.find(({ localKey }) => localKey === forceKey) // Perform search if not targeting source force.
  }
  if (!force) {
    throw new Error(
      `Migration failed. Force with key "${forceKey}" not found. A force with the key must be added to the mission before this migration can be applied.`,
    )
  }
  // Find pool
  let firstPool = force?.resourcePools.sort(
    (poolA, poolB) => poolA.resource.order - poolB.resource.order,
  )[0]
  if (!firstPool) {
    throw new Error(
      `Migration failed. No resource pools found for force "${forceName}". A resource pool must be added to the force before this migration can be applied.`,
    )
  }

  // Update args to include pool metadata instead
  // of simple force metadata.
  effect.arguments.poolMetadata = {
    forceKey,
    forceName,
    poolKey: firstPool.localKey,
    poolName: firstPool.name,
  } satisfies TLegacyPoolMetadata
  delete effect.arguments.forceMetadata
})

export { migrations }
