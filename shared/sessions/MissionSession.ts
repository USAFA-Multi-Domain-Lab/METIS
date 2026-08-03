import type { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'
import type {
  TargetEnvironmentTask,
  TEnvironmentTaskJson,
} from '@shared/target-environments/TargetEnvironmentTask'
import type { TSessionPanelAlert } from '../connect'
import { MetisComponent } from '../MetisComponent'
import type { TExecutionCheats } from '../missions/actions/ActionExecution'
import type { TAction } from '../missions/actions/MissionAction'
import type {
  Mission,
  TMission,
  TMissionExistingJson,
} from '../missions/Mission'
import type { TUserJson } from '../users/User'
import { User } from '../users/User'
import type { TChatChannel, TChatChannelJson } from './chat/ChatChannel'
import type { TMemberRoleId } from './members/MemberRole'
import type { TMember, TSessionMemberJson } from './members/SessionMember'
import type {
  TRealm,
  TSessionRealmBasicJson,
  TSessionRealmJson,
} from './SessionRealm'

/**
 * Base class for sessions. Represents a session of a mission being executed by users.
 */
export abstract class MissionSession<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The user ID of the owner of the session.
   */
  public readonly ownerId: User['_id']

  /**
   * The username of the owner.
   */
  public readonly ownerUsername: User['username']

  /**
   * The first name of the owner.
   */
  public readonly ownerFirstName: User['firstName']

  /**
   * The last name of the owner.
   */
  public readonly ownerLastName: User['lastName']

  /**
   * The full name of the owner.
   */
  public get ownerFullName(): User['name'] {
    return User.getFullName(this.ownerFirstName, this.ownerLastName)
  }

  /**
   * The date/time that the session was launched.
   */
  public readonly launchedAt: Date

  /**
   * Protected cache for `config`.
   */
  protected _config: TSessionConfig
  /**
   * The configuration for the session.
   */
  public get config(): TSessionConfig {
    return { ...this._config }
  }

  /**
   * Protected cache for `mission`.
   */
  protected _mission: TMission<T>
  /**
   * The session's authoring template of the mission.
   * @note This is the source from which realms are minted. Gameplay
   * resolution (force/node/action lookups) for a member happens
   * through that member's realm (`member.subscribedRealm.mission`),
   * not here. Every realm mints its own copy of this template, in
   * both multiplayer and standalone.
   */
  public get mission(): T['mission'] {
    return this._mission
  }

  // Implemented
  public get missionId(): TMission<T>['_id'] {
    return this.mission._id
  }

  /**
   * Protected cache for `realms`.
   */
  protected _realms: TRealm<T>[] = []
  /**
   * The realms in the session, which can be thought of as alternate
   * timelines for the mission be hosted by the session. Each realm has
   * its own copy of a mission, group of members, and game state.
   */
  public get realms(): TRealm<T>[] {
    return [...this._realms]
  }
  /**
   * A blank realm to which the session's members will subscribe to
   * when the realm they should be in cannot be resolved. Consider this
   * the 404 error page of realms.
   */
  public abstract get defaultRealm(): TRealm<T>

  /**
   * Protected cache for `members`.
   */
  protected _members: TMember<T>[]
  /**
   * The members who have joined the session.
   */
  public get members(): TMember<T>[] {
    return [...this._members]
  }

  /**
   * The members who are currently joined (online) in the session.
   * Excludes ghost members who have quit but retain an assignment.
   */
  public get joinedMembers(): TMember<T>[] {
    return this._members.filter(({ joined }) => joined)
  }

  /**
   * The members sorted by their role in the session.
   * @note Sort order: Participants, Limited Observers, Managers, Observers.
   */
  public get membersSorted(): TMember<T>[] {
    let membersRaw = [...this._members]
    let weights = {
      participant: 0,
      observer_limited: 1,
      manager: 2,
      observer: 3,
      access_denied: 4,
    } satisfies Record<TMemberRoleId, number>

    return membersRaw.sort((a, b) => {
      return weights[a.role._id] - weights[b.role._id]
    })
  }

  /**
   * The session members with the 'participant' role.
   */
  public get participants(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'participant')
  }

  /**
   * The session members with the 'observer_limited' role.
   */
  public get limitedObservers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'observer_limited')
  }

  /**
   * The session members with the 'observer' role.
   */
  public get observers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'observer')
  }

  /**
   * The session members with the 'manager' role.
   */
  public get managers(): TMember<T>[] {
    return this._members.filter(({ role }) => role._id === 'manager')
  }

  /**
   * Members with the 'forceAssignable' permission who are not banned.
   * Only these members can be assigned to a force and a realm during
   * session start.
   */
  public get forceAssignableMembers(): TMember<T>[] {
    return this._members.filter(
      (member) => member.isAuthorized('forceAssignable') && !member.banned,
    )
  }

  /**
   * Whether the session has members with the 'forceAssignable' permission
   * who are not banned.
   * @see {@link forceAssignableMembers}
   */
  public get hasForceAssignableMembers(): boolean {
    return this.forceAssignableMembers.length > 0
  }

  /**
   * Protected cache for `state`.
   */
  protected _state: TSessionState
  /**
   * The state of the session (unstarted, started, ended).
   */
  public get state(): TSessionState {
    return this._state
  }

  /**
   * @see {@link MissionSession.environmentTasks}
   */
  protected _environmentTasks: T['environmentTask'][]
  /**
   * The master list of every target-environment task (hooks and
   * effects) captured for this session instance, across the setup,
   * teardown, and live phases.
   * @note This is per instance. Therefore, if the session is reset,
   * this will be cleared during the reset process.
   * @note Use {@link setupTasks}, {@link teardownTasks}, or
   * {@link liveTasks} to obtain a phase-specific view.
   */
  public get environmentTasks(): T['environmentTask'][] {
    return [...this._environmentTasks]
  }

  /**
   * The tasks that run while the session is in its setup phase, either
   * while the session is starting or while it is resetting.
   * @see {@link TargetEnvironmentTask.phase}
   */
  public get setupTasks(): T['environmentTask'][] {
    return this._environmentTasks.filter((task) => task.phase === 'setup')
  }

  /**
   * The tasks that run while the session is in its teardown phase,
   * either while the session is ending or while it is resetting.
   * @see {@link TargetEnvironmentTask.phase}
   */
  public get teardownTasks(): T['environmentTask'][] {
    return this._environmentTasks.filter((task) => task.phase === 'teardown')
  }

  /**
   * The tasks tied to effects that run while the session is in the
   * `'started'` state, captured live as they occur.
   * @see {@link TargetEnvironmentTask.phase}
   */
  public get liveTasks(): T['environmentTask'][] {
    return this._environmentTasks.filter((task) => task.phase === 'live')
  }

  /**
   * Chat channels active in this session.
   */
  protected _chatChannels: TChatChannel<T>[]

  /**
   * Based upon {@link MissionSession.setupTasks}, indicates
   * whether the setup process, if initiated, encountered any
   * failures.
   * @note This is per instance. Therefore, if the session is reset,
   * this will change to false during the reset process after teardown
   * and before setup.
   */
  public get setupFailed(): boolean {
    return this.setupTasks.some((task) => task.status === 'failure')
  }
  /**
   * Based upon {@link MissionSession.teardownTasks}, indicates
   * whether the teardown process, if initiated, encountered any
   * failures.
   * @note This is per instance. Therefore, if the session is reset,
   * this will change to false during the reset process after teardown
   * and before setup.
   */
  public get teardownFailed(): boolean {
    return this.teardownTasks.some((task) => task.status === 'failure')
  }

  /**
   * ** Note: Use the static method `launch` to create a new session with a new session ID. **
   */
  public constructor(
    _id: string,
    name: string,
    ownerId: string,
    ownerUsername: User['username'],
    ownerFirstName: User['firstName'],
    ownerLastName: User['lastName'],
    launchedAt: Date,
    config: Partial<TSessionConfig>,
    mission: TMission<T>,
    realmData: TSessionRealmJson[],
    memberData: TSessionMemberJson[],
    environmentTaskData: TEnvironmentTaskJson[],
    chatChannelData: TChatChannelJson[],
  ) {
    super(_id, name, false)

    this.ownerId = ownerId
    this.ownerUsername = ownerUsername
    this.ownerFirstName = ownerFirstName
    this.ownerLastName = ownerLastName
    this.launchedAt = launchedAt
    this._config = {
      ...MissionSession.DEFAULT_CONFIG,
      ...config,
    }
    this._mission = mission
    this._state = 'unstarted'
    this._realms = this.parseRealmData(realmData)
    this._members = this.parseMemberData(memberData)
    this._environmentTasks = this.parseEnvironmentTaskData(environmentTaskData)
    this._chatChannels = this.parseChatChannelData(chatChannelData)
  }

  /**
   * Checks if the given action has enough resources given the
   * session and any configured cheats.
   * @param action The action in question.
   * @param cheats The cheats to apply to the action. This will determine
   * whether the action can be executed, even if a typical requirement
   * is not met.
   * @returns Whether the action has enough resources to be executed
   * in the session.
   * @note This will be true if one of any of the following conditions
   * are met:
   * 1. The action has zero cost.
   * 2. There are infinite resources in the session.
   * 3. There are enough resources remaining in the session.
   */
  public areEnoughResources(
    action: TAction<T>,
    cheats: Partial<TExecutionCheats> = {},
  ): boolean {
    let enoughResources = action.areEnoughResources
    let zeroCost = !!cheats.zeroCost
    let infiniteResources = this.config.infiniteResources

    // The action has enough resources if it has zero cost,
    // or there are infinite resources, or there are enough
    // resources remaining.
    return zeroCost || infiniteResources || enoughResources
  }

  /**
   * @param action The action in question.
   * @param cheats The cheats to apply to the action. This will determine
   * whether the action can be executed, even if a typical requirement
   * is not met.
   * @returns An array of all costs included in the action whose
   * associated pool does not have enough resources to cover the
   * cost amount.
   */
  public getUnmetCosts(
    action: TAction<T>,
    cheats: Partial<TExecutionCheats> = {},
  ): ActionResourceCost[] {
    let zeroCost = !!cheats.zeroCost
    let infiniteResources = this.config.infiniteResources
    if (zeroCost || infiniteResources) return []
    else return action.unmetCosts
  }

  /**
   * Determines whether the given action can currently be executed in the session.
   * @param action The action in question.
   * @param cheats The cheats to apply to the action. This will determine
   * whether the action can be executed, even if a typical requirement
   * is not met.
   * @returns Whether the action is ready to be executed in the session.
   * @note This will be true if all of the following conditions are met:
   * 1. The action's node is ready to execute.
   * 2. The action has enough resources to execute, given the session and cheats.
   */
  public readyToExecute(
    action: TAction<T>,
    cheats: Partial<TExecutionCheats> = {},
  ): boolean {
    let nodeReady = action.node.readyToExecute
    let enoughResources = this.areEnoughResources(action, cheats)
    let executionLimitReached = action.executionLimitReached

    // The action is ready to execute if the node is ready to execute
    // and there are enough resources for the action, given the session
    // and the cheats.
    return nodeReady && enoughResources && !executionLimitReached
  }

  /**
   * Parses realm JSON data into `SessionRealm` objects.
   * @param data The JSON data of the realms.
   * @returns The parsed realms.
   */
  protected abstract parseRealmData(data: TSessionRealmJson[]): TRealm<T>[]

  /**
   * Parses member JSON data into `MemberSession` objects.
   * @param data The JSON data of the members.
   * @returns The parsed members.
   */
  protected abstract parseMemberData(data: TSessionMemberJson[]): TMember<T>[]

  /**
   * Parses environment-task JSON data into `TargetEnvironmentTask` objects.
   * @param data The JSON data of the environment tasks.
   * @returns The parsed environment tasks.
   */
  protected abstract parseEnvironmentTaskData(
    data: TEnvironmentTaskJson[],
  ): T['environmentTask'][]

  /**
   * Parses channel JSON data into `ChatChannel` objects.
   * @param data The JSON data of the channels.
   * @returns The parsed channels.
   */
  protected abstract parseChatChannelData(
    data: TChatChannelJson[],
  ): TChatChannel<T>[]

  /**
   * Checks if the given user is currently joined (online) in the session
   * (Whether as a participant, manager, or observer).
   * @param userId The ID of the user to check.
   * @returns Whether the given user is joined into the session.
   * @note A ghost member (quit but retaining an assignment) is not
   * considered joined.
   */
  public isJoined(userId: User['_id']): boolean {
    for (let member of this._members) {
      if (member.userId === userId && member.joined) return true
    }
    return false
  }

  /**
   * @param _id The ID of the member to get.
   * @returns The member with the given ID, or undefined
   * if not found.
   */
  public getMember(
    _id: TMember<T>['_id'] | null | undefined,
  ): TMember<T> | undefined {
    return this.members.find((member) => member._id === _id)
  }

  /**
   * @param userId The ID of the user to get the member for.
   * @returns The member with the given user ID, or undefined
   * if not found.
   */
  public getMemberByUserId(
    userId: User['_id'] | null | undefined,
  ): TMember<T> | undefined {
    return this.members.find((member) => member.userId === userId)
  }

  /**
   * @param realmId The ID of the realm to get.
   * @returns The realm with the given ID, or undefined if not found.
   */
  public getRealm(
    realmId: TRealm<T>['_id'] | null | undefined,
  ): TRealm<T> | undefined {
    if (realmId === null || realmId === undefined) return undefined
    return this._realms.find((realm) => realm._id === realmId)
  }

  /**
   * Gets a chat channel by its ID.
   * @param channelId The ID of the chat channel.
   * @returns The chat channel with the given ID, or undefined if not found.
   */
  public getChatChannel(
    channelId: TChatChannel<T>['_id'] | null | undefined,
  ): TChatChannel<T> | undefined {
    return this._chatChannels.find((channel) => channel._id === channelId)
  }

  /**
   * Adds a task to the master list, or replaces the existing entry that
   * shares its ID. Replacement is what lets a task transition from one
   * state to the next (e.g. queued to running) without producing a
   * duplicate.
   * @param task The task to record.
   */
  protected upsertTask(task: T['environmentTask']): void {
    let index = this._environmentTasks.findIndex(
      (existing) => existing._id === task._id,
    )
    if (index === -1) {
      this._environmentTasks.push(task)
    } else {
      this._environmentTasks[index] = task
    }
  }

  /**
   * Converts the Session object to JSON.
   * @returns A JSON representation of the session.
   */
  public abstract toJson(): TSessionJson

  /**
   * Converts the Session object to basic JSON.
   * @returns A basic (Limited) JSON representation of the session.
   */
  public abstract toBasicJson(): TSessionBasicJson

  /**
   * The endpoint for accessing sessions on the API.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/sessions'

  /**
   * The name to use for the default realm of the session.
   */
  public static readonly DEFAULT_REALM_NAME: string = 'The World of 404s'

  /**
   * The ID to use for the default realm of the session.
   */
  public static readonly DEFAULT_REALM_ID: string = 'the-world-of-404s'

  /**
   * Default value for the session configuration.
   */
  public static get DEFAULT_CONFIG(): TSessionConfig {
    return {
      accessibility: 'public',
      mode: 'multiplayer',
      isTest: false,
      infiniteResources: false,
      explicitlyDisabledEnvironments: [],
      targetEnvConfigs: {},
    }
  }

  /**
   * Cheat options which essentially disables all cheats
   * and allows for a normal session experience.
   */
  public static get NO_CHEATS(): TExecutionCheats {
    return {
      guaranteedSuccess: false,
      zeroCost: false,
      instantaneous: false,
    }
  }

  /**
   * Possible states in which a session can be found.
   */
  public static get AVAILABLE_STATES(): TSessionState[] {
    return ['unstarted', 'starting', 'started', 'ending', 'ended', 'resetting']
  }

  /**
   * Options for the accessibility of the session.
   */
  public static get ACCESSIBILITY_OPTIONS(): TSessionAccessibility[] {
    return ['public', 'id-required', 'invite-only', 'owner-only']
  }

  /**
   * The available play modes for a session.
   */
  public static get AVAILABLE_MODES(): TSessionMode[] {
    return ['multiplayer', 'standalone']
  }

  /**
   * Coerces a session configuration so its interdependent options remain
   * self-consistent, returning a corrected copy. Currently this enforces
   * that an owner-only session is always multiplayer: because only the
   * owner (a complete-visibility manager, never a participant) may join
   * such a session, standalone would have no participants to mint
   * realms for and would start blank. The standalone force is cleared
   * alongside the mode so no stale selection is retained.
   * @param config The configuration to normalize.
   * @returns A normalized copy of the configuration.
   */
  public static normalizeConfig(config: TSessionConfig): TSessionConfig {
    let normalized = { ...config }
    if (normalized.accessibility === 'owner-only') {
      normalized.mode = 'multiplayer'
      normalized.standaloneForceId = undefined
    }
    return normalized
  }

  /**
   * Reports the first problem found in a session configuration, without
   * correcting any of it.
   * @param config The configuration to check.
   * @param mission The mission the session is configured against.
   * @param options Additional options for the check.
   * @returns A description of the problem, or null when the
   * configuration is valid.
   * @note This does not normalize. Run
   * {@link MissionSession.normalizeConfig} first, or a configuration
   * will be reported as invalid for a combination normalizing was about
   * to resolve.
   */
  public static validateConfig(
    config: TSessionConfig,
    mission: Mission,
    options: TSessionConfigValidationOptions = {},
  ): string | null {
    const { requireComplete = false } = options

    // Only standalone mode reads the force, so nothing else can be
    // wrong with it.
    if (config.mode !== 'standalone') return null

    // Only enforce a force selection if the configuration
    // is expected to be complete, since another update may
    // be in progress to correct the problem.
    if (!config.standaloneForceId) {
      return requireComplete
        ? 'A standalone session requires a configured force.'
        : null
    }

    // Every participant's realm is minted from the configured force, so
    // it has to be a force the mission actually has. This holds at any
    // point in a session's life, complete configuration or not.
    if (!mission.getForceById(config.standaloneForceId)) {
      return `Force with ID "${config.standaloneForceId}" was not found in the mission.`
    }

    return null
  }
}

/* -- TYPES -- */

/**
 * The accessiblity of the session to students.
 * @option 'public' The session is accessible to all students.
 * @option 'id-required' The session is accessible to students with the session ID.
 * @option 'invite-only' The session is accessible to students with an invite.
 * @option 'owner-only' The session is only joinable by its owner and is not
 * listed to other users.
 */
export type TSessionAccessibility =
  | 'public'
  | 'id-required'
  | 'invite-only'
  | 'owner-only'

/**
 * The play mode of a session.
 * @option 'multiplayer' Participants share one realm.
 * @option 'standalone' Each participant gets their own realm.
 */
export type TSessionMode = 'multiplayer' | 'standalone'

/**
 * Options for {@link MissionSession.validateConfig}.
 */
export type TSessionConfigValidationOptions = {
  /**
   * Whether the configuration is expected to be complete, rather than
   * an in-progress edit of one.
   * @note A complete standalone configuration has to name a force. One
   * still being edited does not have to have chosen it yet.
   * @default false
   */
  requireComplete?: boolean
}

/**
 * Configuration options for a session, customizing the experience.
 */
export type TSessionConfig = {
  /**
   * The accessiblity of the session to students.
   * @default 'public'
   */
  accessibility: TSessionAccessibility
  /**
   * The play mode of the session.
   * @option 'multiplayer' Every participant shares a single realm
   * (a full copy of the launched mission). This is the default and
   * matches the historical behavior.
   * @option 'standalone' Each participant gets their own realm
   * containing only the selected force, isolating their play.
   * @default 'multiplayer'
   */
  mode: TSessionMode
  /**
   * The ID of the force each participant plays when the session is
   * in standalone mode.
   * @note Required when `mode` is `'standalone'`; ignored
   * otherwise.
   * @default null
   */
  standaloneForceId?: string
  /**
   * Whether the session is a throwaway play-test launched by its
   * owner to try out a mission.
   * @note When true, `accessibility` is forced to `'owner-only'`, the
   * session auto-starts on launch (it enters `'starting'` and runs
   * setup normally, without a manual lobby Start), the owner is auto-joined,
   * and the session auto-destroys once the owner quits.
   * @default false
   */
  isTest: boolean
  /**
   * Whether resources will be infinite in the session.
   * @default false
   */
  infiniteResources: boolean
  /**
   * Array of target environment IDs the manager has explicitly disabled.
   * @note This holds only the explicit choices. The effective set of
   * environments whose effects will not execute also includes any the
   * session mode disables implicitly (in standalone, every environment
   * without `multiRealmSupport`). Resolve the effective set with
   * {@link Mission.getDisabledEnvironments} rather than reading this
   * field directly.
   * @default []
   * @example ['metis', 'metis-test-env']
   */
  explicitlyDisabledEnvironments: string[]
  /**
   * Map of target environment IDs to selected config IDs.
   * @note Tracks which configuration is selected for each target environment used in the session.
   * @example { 'metis': 'metis-config-main' }
   */
  targetEnvConfigs: Record<string, string>
  /**
   * The name of the session.
   * @note If not provided, the name of the mission will be used.
   */
  name?: string
}

/**
 * JSON representation of a session.
 */
export type TSessionJson = {
  /**
   * The ID of the session.
   */
  _id: string
  /**
   * The state of the session (unstarted, started, ended).
   */
  state: TSessionState
  /**
   * The name of the session.
   */
  name: string
  /**
   * The ID of the owner of the session.
   */
  ownerId: User['_id']
  /**
   * The username of the owner.
   */
  ownerUsername: User['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: User['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: User['lastName']
  /**
   * The ISO date/time that the session was launched.
   */
  launchedAt: string
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The session's authoring template of the mission. This is the source
   * from which realms are minted and is not the live gameplay state.
   * Gameplay state lives in each realm's own mission copy.
   */
  mission: TMissionExistingJson
  /**
   * The realms in the session that are visible to the recipient.
   * Contains only the subscribed realm for participants/observers,
   * or is empty if the member has no subscribed realm.
   */
  realms: TSessionRealmJson[]
  /**
   * Shallow, mission-free summaries of every realm in the session, for
   * building a realm switcher. Populated only for members with complete
   * visibility; empty for everyone else.
   */
  realmBasics: TSessionRealmBasicJson[]
  /**
   * The members of the session in the mission.
   */
  members: TSessionMemberJson[]
  /**
   * @see {@link MissionSession.environmentTasks}
   */
  environmentTasks: TEnvironmentTaskJson[]
  /**
   * The chat channels in the session, each with their messages.
   */
  chatChannels: TChatChannelJson[]
  /**
   * Unread chat messages for each individual chat channel.
   * @note This is tracked for each session member individually.
   */
  unreadChatChannelMessages: Record<string, number>
  /**
   * The panels in a session with unacknowledged activity.
   * @note This is tracked for each session member individually.
   * @note Activity in these panels may include new messages, outputs, files, etc.
   */
  pendingSessionPanelAlerts: TSessionPanelAlert[]
}

/**
 * A more basic (limited) JSON representation of a session.
 */
export type TSessionBasicJson = {
  /**
   * The ID of the session.
   */
  _id: string
  /**
   * The ID of the mission being executed by the participants.
   */
  missionId: string
  /**
   * The state of the session (unstarted, started, ended).
   */
  state: TSessionState
  /**
   * The name of the session.
   */
  name: string
  /**
   * The ID of the owner of the session.
   */
  ownerId: NonNullable<TUserJson['_id']>
  /**
   * The username of the owner.
   */
  ownerUsername: TUserJson['username']
  /**
   * The first name of the owner.
   */
  ownerFirstName: TUserJson['firstName']
  /**
   * The last name of the owner.
   */
  ownerLastName: TUserJson['lastName']
  /**
   * The ISO date/time that the session was launched.
   */
  launchedAt: string
  /**
   * The configuration for the session.
   */
  config: TSessionConfig
  /**
   * The IDs of the participants of the session.
   */
  participantIds: string[]
  /**
   * The IDs of the limited-observers of the session.
   */
  limitedObserverIds: string[]
  /**
   * The IDs of the observers of the session.
   */
  observerIds: string[]
  /**
   * The IDs of the managers of the session.
   */
  managerIds: string[]
  /**
   * The number of members currently joined (online) in the session.
   */
  joinedMemberCount: number
  /**
   * @see {@link MissionSession.setupFailed}
   */
  setupFailed: boolean
  /**
   * @see {@link MissionSession.teardownFailed}
   */
  teardownFailed: boolean
}

/**
 * Extracts the session type from a registry of METIS
 * components type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The session type.
 */
export type TSession<T extends TMetisBaseComponents> = T['session']

/**
 * Describes the current position of a session in its lifecycle.
 */
// ! If you add a new session state, make sure to
// ! update the AVAILABLE_STATES static getter in
// ! the MissionSession class.
export type TSessionState =
  | 'unstarted'
  | 'starting'
  | 'started'
  | 'ending'
  | 'ended'
  | 'resetting'

/**
 * The role of a user in a session.
 */
export type TSessionRole = 'participant' | 'observer' | 'manager' | 'not-joined'
