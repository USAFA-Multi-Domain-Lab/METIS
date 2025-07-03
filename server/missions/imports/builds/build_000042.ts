import { TMissionImportBuild } from '..'

// -- BUILD 42 --
// This migration script is responsible for adding the
// `localKey` property to all forces, nodes, actions, and
// effects within the missions in the database.

/**
 * Assigns a local key to each component in the provided array.
 * @param components An array of components (forces, nodes, actions, effects).
 * @returns The array of components with assigned local keys.
 */
function assignLocalKeys(components: any[]): any[] {
  return components.map((component, index) => {
    // If the component already has a localKey, return it.
    if (component.localKey !== undefined) return component

    // Assign a new localKey to the component.
    component.localKey = String(index + 1)
    return component
  })
}

const build: TMissionImportBuild = (missionData) => {
  missionData.forces = assignLocalKeys(missionData.forces)

  missionData.forces.forEach((force: any) => {
    force.nodes = assignLocalKeys(force.nodes)

    force.nodes.forEach((node: any) => {
      node.actions = assignLocalKeys(node.actions)

      node.actions.forEach((action: any) => {
        action.effects = assignLocalKeys(action.effects)
      })
    })
  })
}

export default build
