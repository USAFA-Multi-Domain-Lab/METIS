import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { TServerEvents, TServerMethod } from '@shared/connect'
import type { TNonEmptyArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { ServerSessionMember } from './ServerSessionMember'
import type { ServerSessionRealm } from './ServerSessionRealm'
import type { SessionServer } from './SessionServer'

/**
 * Many methods within {@link SessionServer} require emitting events
 * to clients based on a set of component IDs. This class batches
 * together component IDs for efficient emission to clients with
 * different visibility permissions.
 */
export class ComponentModifierBatchMap<
  TComponent extends TModifierBatchMapValidComponent,
> {
  /**
   * A map of force IDs to component IDs. The idea is that each
   * force ID indexes a batch of data that is relevant to that force.
   * Since many session members only have visibility into one force,
   * this allows us to emit events efficiently by only sending
   * relevant data to each force.
   */
  private internalMap: Map<string, MissionComponentArray<TComponent>>

  /**
   * Reference to the session, which is needed to access members
   * for emitting events to clients.
   */
  private get session(): SessionServer {
    return this.realm.session
  }

  /**
   * The realm in which this batch is being emitted. All events are scoped
   * to this realm and only members subscribed to this realm will receive
   * emitted events.
   */
  private realm: ServerSessionRealm

  /**
   * @param realm The realm instance, needed to access members for emitting events.
   * @param components The components to batch together for emission. These should all
   * be of the same type (e.g. all nodes or all actions) and should all belong to the
   * same session and realm.
   */
  public constructor(realm: ServerSessionRealm, components: Array<TComponent>) {
    this.realm = realm
    this.internalMap = new Map<string, MissionComponentArray<TComponent>>([
      [
        ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        new MissionComponentArray<TComponent>(),
      ],
    ])

    for (let component of components) {
      if (!this.internalMap.has(component.forceId)) {
        this.internalMap.set(
          component.forceId,
          new MissionComponentArray<TComponent>(),
        )
      }
      this.internalMap.get(component.forceId)!.push(component)
      this.internalMap
        .get(
          ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        )!
        .push(component)
    }
  }

  /**
   * @returns The complete-visibility members that should receive
   * this batch, scoped to the members resolving to the batch's realm.
   */
  private getCompleteVisibilityMembers(): ServerSessionMember[] {
    let realm = this.realm
    let members = realm.session.getMembersWithPermissions('completeVisibility')
    return members.filter((member) => member.subscribedRealmId === realm._id)
  }

  /**
   * Emits an event to the clients in batches based on each client's
   * visibility permissions.
   * @param method The server method to emit.
   * @param constructPayload A function that constructs the payload for the event, given a list of component IDs.
   */
  public emit<
    TMethod extends TServerMethod,
    TPayloadData extends Omit<TServerEvents[TMethod], 'method'>,
  >(
    method: TMethod,
    constructPayload: (
      components: TNonEmptyArray<TComponent> &
        MissionComponentArray<TComponent>,
      members: TNonEmptyArray<ServerSessionMember>,
      batchId: string,
    ) => TPayloadData,
  ): void {
    this.forCompleteVisibilityBatch((components, members, batchId) => {
      ServerSessionMember.emitToGroup(
        members,
        method,
        constructPayload(components, members, batchId),
      )
    })
    this.forEachLimitedVisibilityBatch((components, members, forceId) => {
      ServerSessionMember.emitToGroup(
        members,
        method,
        constructPayload(components, members, forceId),
      )
    })
  }

  /**
   * Emits an event to each client individually, in the same batches
   * {@link emit} uses, so the payload can be constructed for one member.
   * @param method The server method to emit.
   * @param constructPayload A function that constructs the payload for
   * the event, given a list of component IDs and the receiving member.
   */
  public emitMemberSpecific<
    TMethod extends TServerMethod,
    TPayloadData extends Omit<TServerEvents[TMethod], 'method'>,
  >(
    method: TMethod,
    constructPayload: (
      components: TNonEmptyArray<TComponent> &
        MissionComponentArray<TComponent>,
      member: ServerSessionMember,
      batchId: string,
    ) => TPayloadData,
  ): void {
    this.forCompleteVisibilityBatch((components, members, batchId) => {
      for (let member of members) {
        member.emit(method, constructPayload(components, member, batchId))
      }
    })
    this.forEachLimitedVisibilityBatch((components, members, batchId) => {
      for (let member of members) {
        member.emit(method, constructPayload(components, member, batchId))
      }
    })
  }

  /**
   * Calls the callback once for the complete-visibility batch,
   * providing the components, members, and batch ID for that batch.
   * @param callback A function that will be called for the
   * complete-visibility batch.
   * @note Will not call the callback if there are no components
   * or members for the complete-visibility batch.
   */
  private forCompleteVisibilityBatch(
    callback: (
      components: TNonEmptyArray<TComponent> &
        MissionComponentArray<TComponent>,
      members: TNonEmptyArray<ServerSessionMember>,
      batchId: string,
    ) => void,
  ): void {
    let components = this.internalMap.get(
      ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
    )!
    if (!ArrayToolbox.isNotEmpty(components)) return
    let members = this.getCompleteVisibilityMembers()
    if (!ArrayToolbox.isNotEmpty(members)) return

    callback(
      components,
      members,
      ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
    )
  }

  /**
   * Loops through each limited-visibility batch in the internal
   * map and executes the provided callback with the components,
   * members, and batch ID (force ID) for that batch.
   * @param callback A function that will be called for each batch.
   * @note Will not call the callback if there are no components
   * or members for the given batch.
   */
  private forEachLimitedVisibilityBatch(
    callback: (
      components: TNonEmptyArray<TComponent> &
        MissionComponentArray<TComponent>,
      members: TNonEmptyArray<ServerSessionMember>,
      forceId: string,
    ) => void,
  ): void {
    this.internalMap.forEach((components, forceId) => {
      if (
        forceId ===
          ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY ||
        !ArrayToolbox.isNotEmpty(components)
      ) {
        return
      }
      let members = this.session.getMembersForForce(forceId, this.realm._id, {
        limitedVisibilityOnly: true,
      })
      if (!ArrayToolbox.isNotEmpty(members)) return

      callback(components, members, forceId)
    })
  }

  /**
   * Used by {@link ComponentModifierBatchMap} to index
   * a comprehensive list of all modified components regardless
   * of visibility. This will be used to send a batch of modified
   * components to any members of the session that have complete
   * visibility of the entire mission, such as managers.
   */
  private static COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY = 'FULL-SCOPE'
}

/**
 * An array of components that are supported by the {@link ComponentModifierBatchMap} class.
 */
class MissionComponentArray<
  T extends TModifierBatchMapValidComponent,
> extends Array<T> {
  public get _ids(): string[] {
    return ArrayToolbox.mapProperty(this, '_id')
  }
}

/* -- TYPES -- */

/**
 * Component types that are supported by the
 * {@link ComponentModifierBatchMap} class.
 */
export type TModifierBatchMapValidComponent =
  | ServerMissionForce
  | ServerMissionNode
  | ServerMissionAction
  | ServerResourcePool

export type { MissionComponentArray }
