import {
  createMissionPayload,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { TestToolbox } from 'tests/helpers/TestToolbox'

/**
 * Replaces every action in the payload with a copy that is instant, always
 * successful, and effect-free, so an execution resolves deterministically and
 * deducts only its resource costs.
 * @param payload The mission payload to modify in place.
 * @note Each action is replaced rather than mutated because an action's
 * `effects` is a read-only property; assigning a fresh action object is how
 * the socket suites clear it.
 */
export function makeActionsInstantAndEffectFree(
  payload: TMissionCreatePayload,
): void {
  for (let force of payload.forces) {
    for (let node of force.nodes) {
      for (let index = 0; index < (node.actions?.length ?? 0); index++) {
        node.actions![index] = {
          ...node.actions![index],
          effects: [],
          baseProcessTime: 0,
          baseSuccessChance: 1,
        }
      }
    }
  }
}

/**
 * Builds a two-force mission whose objective action is instant, always
 * successful, and effect-free, and whose session-triggered effects are
 * stripped, so a session test can execute actions deterministically and reach
 * the started state quickly.
 * @param options.namePrefix Prefix for the generated mission name.
 * @returns The playable mission payload.
 * @note The forces, resources, and objective action keep the identifiers of
 * {@link createMissionPayload}, so a test can read `payload.forces[n]._id` and
 * `payload.resources[n]._id` directly.
 */
export function createPlayableMissionPayload(
  options: TCreatePlayableMissionOptions = {},
): TMissionCreatePayload {
  let { namePrefix = 'test_session' } = options
  let payload = createMissionPayload(
    `${namePrefix}_mission_${TestToolbox.generateRandomId()}`,
  )

  payload.effects = []
  makeActionsInstantAndEffectFree(payload)

  return payload
}

/* -- TYPES -- */

/**
 * Options for {@link createPlayableMissionPayload}.
 */
export type TCreatePlayableMissionOptions = {
  /**
   * Prefix for the generated mission name.
   * @default 'test_session'
   */
  namePrefix?: string
}
