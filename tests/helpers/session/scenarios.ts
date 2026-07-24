import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { TResponseEvents } from '@shared/connect'
import { Mission, type TMissionJson } from '@shared/missions/Mission'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { TMissionCreatePayload } from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { createPlayableMissionPayload } from 'tests/helpers/session/missions'
import {
  TestSession,
  type TTestMemberContext,
  type TTestMemberSpecification,
  type TTestSessionContext,
} from 'tests/helpers/TestSession'

/* -- LAUNCH SCENARIOS -- */

/**
 * Launches a playable session and, by default, brings it to its started state.
 * The mission's actions are instant and effect-free (see
 * {@link createPlayableMissionPayload}), so executions resolve deterministically.
 * @param options See {@link TLaunchPlayableOptions}.
 * @returns The launched session context and the mission payload it was built
 * from, so a test can read force and resource identifiers.
 */
export async function launchPlayableSession(
  options: TLaunchPlayableOptions = {},
): Promise<TPlayableLaunch> {
  let {
    members = [],
    config = {},
    start = true,
    reveal = start,
    namePrefix = 'test_session',
    customizeMission,
  } = options

  let payload = createPlayableMissionPayload({ namePrefix })
  customizeMission?.(payload)

  let context = await TestSession.launch({
    namePrefix,
    mission: { payload },
    config,
    members,
    start,
    reveal,
  })

  return { context, payload }
}

/**
 * Launches a standalone session with the given number of participants, each of
 * whom is routed to the configured force and its own realm at start.
 * @param options See {@link TLaunchStandaloneOptions}.
 * @returns The launched context, the mission payload, and the configured
 * standalone force ID.
 * @note Participants are given no explicit force: standalone assigns every
 * force-assignable member to the configured force and its realm at start, and
 * an explicit force assignment would be rejected in standalone mode.
 */
export async function launchStandaloneSession(
  options: TLaunchStandaloneOptions = {},
): Promise<TStandaloneLaunch> {
  let {
    participantCount = 1,
    standaloneForceIndex = 0,
    start = true,
    namePrefix = 'test_session',
    customizeMission,
  } = options

  let payload = createPlayableMissionPayload({ namePrefix })
  customizeMission?.(payload)
  let standaloneForceId = payload.forces[standaloneForceIndex]._id

  let context = await TestSession.launch({
    namePrefix,
    mission: { payload },
    config: { mode: 'standalone', standaloneForceId },
    members: Array.from(
      { length: participantCount },
      (): TTestMemberSpecification => ({}),
    ),
    start,
    reveal: start,
  })

  return { context, payload, standaloneForceId }
}

/* -- GAMEPLAY RESOLUTION -- */

/**
 * Resolves the objective node's action and the resource pools a member plays
 * with, from the member's own realm.
 * @param memberContext The member whose realm the action is resolved from.
 * @returns The member's force, its objective action, and its fuel and intel
 * pools.
 * @note Complete-visibility members (managers) have no assigned force, so the
 * first force of their subscribed realm is used.
 */
export function resolveObjectiveExecution(
  memberContext: TTestMemberContext,
): TObjectiveExecution {
  let force =
    memberContext.member.assignedForce ??
    memberContext.member.subscribedRealm.mission.forces[0]
  if (!force) {
    throw new Error('Member has no force to execute against.')
  }
  let action = Array.from(force.nodes[1].actions.values())[0]
  return {
    force,
    action,
    fuelPool: force.resourcePools[0],
    intelPool: force.resourcePools[1],
  }
}

/**
 * @param action The action whose cost is read.
 * @param resourceId The resource whose cost amount is returned.
 * @returns The action's included cost for the resource, or `0` if it has none.
 */
export function resourceCostOf(
  action: ServerMissionAction,
  resourceId: string,
): number {
  return (
    action.includedCosts.find((cost) => cost.resourceId === resourceId)
      ?.amount ?? 0
  )
}

/* -- SESSION-STATE READERS -- */

/**
 * Reads a force's pool balance out of a serialized mission.
 * @param mission The serialized mission (a realm's or the template's).
 * @param forceId The force whose pool is read.
 * @param resourceId The resource of the pool.
 * @returns The pool balance, or `undefined` if the force or pool is absent.
 */
export function findForcePoolBalance(
  mission: TMissionJson,
  forceId: string,
  resourceId: string,
): number | undefined {
  let force = Mission.getForceById(mission, forceId)
  return force?.resourcePools.find((pool) => pool.resourceId === resourceId)
    ?.balance
}

/**
 * Reads a force's pool balance from the subscribed realm carried by a
 * `current-session` response — the live gameplay state.
 * @param response The `current-session` response event.
 * @param forceId The force whose pool is read.
 * @param resourceId The resource of the pool.
 * @param options.realmIndex Which realm in the response to read. Defaults to
 * `0`, the requester's subscribed realm.
 */
export function readRealmPoolBalance(
  response: TResponseEvents['current-session'],
  forceId: string,
  resourceId: string,
  options: { realmIndex?: number } = {},
): number | undefined {
  let { realmIndex = 0 } = options
  let realm = response.data.session?.realms[realmIndex]
  if (!realm) return undefined
  return findForcePoolBalance(realm.mission, forceId, resourceId)
}

/**
 * Reads a force's pool balance from the authoring template carried by a
 * `current-session` response — the source realms are minted from, which
 * gameplay never mutates.
 * @param response The `current-session` response event.
 * @param forceId The force whose pool is read.
 * @param resourceId The resource of the pool.
 */
export function readTemplatePoolBalance(
  response: TResponseEvents['current-session'],
  forceId: string,
  resourceId: string,
): number | undefined {
  let mission = response.data.session?.mission
  if (!mission) return undefined
  return findForcePoolBalance(mission, forceId, resourceId)
}

/* -- TYPES -- */

/**
 * Options shared by the playable launch helpers.
 */
type TPlayableLaunchBase = {
  /**
   * Whether to start the session once its members are assigned.
   * @default true
   */
  start?: boolean
  /**
   * Prefix applied to generated user, mission, and session names.
   * @default 'test_session'
   */
  namePrefix?: string
  /**
   * Mutates the playable mission payload before the session is launched, for
   * adjusting forces, resources, or effects. Applied after the payload is made
   * playable.
   */
  customizeMission?: (payload: TMissionCreatePayload) => void
}

/**
 * Options for {@link launchPlayableSession}.
 */
export type TLaunchPlayableOptions = TPlayableLaunchBase & {
  /**
   * The members to create, connect, and join to the session.
   * @default []
   */
  members?: TTestMemberSpecification[]
  /**
   * Configuration applied to the launched session.
   * @default {}
   */
  config?: Partial<TSessionConfig>
  /**
   * Whether to reveal each member's assigned force after start.
   * @default Matches {@link start}.
   */
  reveal?: boolean
}

/**
 * Options for {@link launchStandaloneSession}.
 */
export type TLaunchStandaloneOptions = TPlayableLaunchBase & {
  /**
   * The number of participants to join.
   * @default 1
   */
  participantCount?: number
  /**
   * The index of the force participants play, into the mission's forces.
   * @default 0
   */
  standaloneForceIndex?: number
}

/**
 * The result of a playable launch.
 */
export type TPlayableLaunch = {
  /**
   * The launched session context.
   */
  context: TTestSessionContext
  /**
   * The mission payload the session was built from, for reading force and
   * resource identifiers.
   */
  payload: TMissionCreatePayload
}

/**
 * The result of a standalone launch.
 */
export type TStandaloneLaunch = TPlayableLaunch & {
  /**
   * The ID of the force every participant plays.
   */
  standaloneForceId: string
}

/**
 * The objective action and pools a member plays with.
 */
export type TObjectiveExecution = {
  /**
   * The member's force.
   */
  force: ServerMissionForce
  /**
   * The objective node's action.
   */
  action: ServerMissionAction
  /**
   * The force's fuel pool.
   */
  fuelPool: ServerResourcePool
  /**
   * The force's intel pool.
   */
  intelPool: ServerResourcePool
}
