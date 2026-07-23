import { MetisComponent } from '../MetisComponent'
import type { TAction } from '../missions/actions/MissionAction'
import type { TMission, TMissionJson } from '../missions/Mission'
import type { TSession } from './MissionSession'

/**
 * A parallel, isolated copy of a mission within a session.
 *
 * A realm owns its own copy of the mission and all of the
 * mutable, mission-rooted session state derived from it. A
 * multiplayer session has exactly one realm (a full copy of
 * the launched mission), while a standalone session has one
 * realm per participant, each containing only that participant's
 * selected force.
 *
 * @note This is a sibling of {@link MissionSession} and
 * {@link SessionMember}, not a `MissionComponent`, because it
 * *owns* a mission rather than living inside a mission's
 * component tree.
 */
export abstract class SessionRealm<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MetisComponent {
  /**
   * The session to which the realm belongs.
   */
  public session: TSession<T>

  /**
   * The realm's own copy of the mission.
   * @note All gameplay resolution (`getForceById`, `getNodeById`,
   * `getActionById`, resources, files) for a member in this realm
   * is rooted at this mission, not the session's authoring template.
   */
  public mission: TMission<T>

  /**
   * A map of action IDs to actions compiled from those found
   * in this realm's copy of the mission.
   * @note Keyed within this realm's id-space, so the same action
   * id in two realms resolves to two distinct objects.
   */
  public actions: Map<string, TAction<T>> = new Map<string, TAction<T>>()

  /**
   * Creates a new SessionRealm object.
   * @param _id The unique ID of the realm.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   */
  protected constructor(
    _id: string,
    name: string,
    session: TSession<T>,
    mission: TMission<T>,
  ) {
    super(_id, name, false)
    this.session = session
    this.mission = mission
    this.initialize()
  }

  /**
   * Initializes the realm's mission state for use.
   */
  protected abstract initialize(): void

  /**
   * Loops through every action in this realm's copy of the
   * mission and maps the action ID to the action in
   * {@link SessionRealm.actions}.
   */
  public mapActions(): void {
    this.actions = new Map<string, TAction<T>>()

    this.mission.forces.forEach((force) =>
      force.nodes.forEach((node) =>
        node.actions.forEach((action) => this.actions.set(action._id, action)),
      ),
    )
  }

  /**
   * @param actionId The ID of the action to get.
   * @returns The action with the given ID within this realm,
   * or undefined if not found.
   */
  public getAction(
    actionId: TAction<T>['_id'] | null | undefined,
  ): TAction<T> | undefined {
    if (actionId === null || actionId === undefined) return undefined
    return this.actions.get(actionId)
  }

  /**
   * Converts the SessionRealm object to JSON.
   * @returns A JSON representation of the realm.
   */
  public abstract toJson(): TSessionRealmJson

  /**
   * Converts the realm to a shallow JSON representation carrying only
   * display metadata — notably no mission. Used to give complete-visibility
   * members a listing of every realm they can switch into without shipping
   * a full mission copy for each one.
   * @returns A basic JSON representation of the realm.
   */
  public toBasicJson(): TSessionRealmBasicJson {
    return {
      _id: this._id,
      name: this.name,
      memberCount: this.session.joinedMembers.filter(
        (member) => member.subscribedRealmId === this._id,
      ).length,
    }
  }
}

/* -- TYPES -- */

/**
 * Extracts the realm type from a registry of METIS components
 * type that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The realm type.
 */
export type TRealm<T extends TMetisBaseComponents> = T['realm']

/**
 * JSON representation of a {@link SessionRealm}.
 */
export interface TSessionRealmJson {
  /**
   * The ID of the realm.
   */
  _id: string
  /**
   * A human-readable name for the realm.
   */
  name: string
  /**
   * The realm's copy of the mission.
   * @note A live gameplay snapshot, not a persisted record, so
   * database-identity fields (createdAt, createdBy, etc.) will be absent.
   */
  mission: TMissionJson
}

/**
 * A shallow, mission-free JSON representation of a {@link SessionRealm},
 * carrying only what a realm-switcher UI needs to list and identify realms.
 * Parallels {@link TSessionBasicJson} for sessions.
 */
export interface TSessionRealmBasicJson {
  /**
   * The ID of the realm.
   */
  _id: string
  /**
   * A human-readable name for the realm.
   */
  name: string
  /**
   * The number of members currently subscribed to the realm.
   */
  memberCount: number
}
