import StringToolbox from 'metis/toolbox/strings'
import { TMissionImportBuild } from '..'

// -- BUILD 49 --
// This migration script is responsible for moving
// post-execution success and failure text from the
// action level to the effect level.

/**
 * Generates a new key for an effect.
 * @returns The new key for an effect.
 */
function generateEffectKey(action: any): string {
  // Initialize
  let newKey: number = 0

  for (let effect of action.effects) {
    let effectKey: number = Number(effect.localKey)
    // If the effect has a key, and it is greater than the current
    // new key, set the new key to the effect's key.
    if (effectKey > newKey) newKey = Math.max(newKey, effectKey)
  }

  // Increment the new key by 1 and return it as a string.
  newKey++
  return String(newKey)
}

const build: TMissionImportBuild = async (missionData) => {
  for (const force of missionData.forces) {
    // Loop through nodes.
    for (const node of force.nodes) {
      // Loop through actions.
      for (const action of node.actions) {
        if (
          action.postExecutionSuccessText ||
          action.postExecutionFailureText
        ) {
          if (!action.effects) {
            action.effects = []
          }

          if (action.postExecutionSuccessText) {
            action.effects.push({
              _id: StringToolbox.generateRandomId(),
              name: 'Post-Execution Success Message',
              description: '',
              localKey: generateEffectKey(action),
              targetId: 'output',
              environmentId: 'METIS',
              targetEnvironmentVersion: '0.2.0',
              trigger: 'success',
              args: {
                message: action.postExecutionSuccessText,
                forceMetadata: { forceKey: 'self', forceName: 'self' },
              },
            })
            delete action.postExecutionSuccessText
          }

          if (action.postExecutionFailureText) {
            action.effects.push({
              _id: StringToolbox.generateRandomId(),
              name: 'Post-Execution Failure Message',
              description: '',
              localKey: generateEffectKey(action),
              targetId: 'output',
              environmentId: 'METIS',
              targetEnvironmentVersion: '0.2.0',
              trigger: 'failure',
              args: {
                message: action.postExecutionFailureText,
                forceMetadata: { forceKey: 'self', forceName: 'self' },
              },
            })
            delete action.postExecutionFailureText
          }
        }
      }
    }
  }
}

export default build
