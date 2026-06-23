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
      components: MissionComponentArray<TComponent>,
      members: TNonEmptyArray<ServerSessionMember>,
      batchId: string,
    ) => TPayloadData,
  ): void {
    let completeVisibilityMembers =
      this.session.getMembersWithPermissions('completeVisibility')

    // Emit a force-agnostic event to all complete-visibility members,
    // if any.
    if (completeVisibilityMembers.length) {
      ServerSessionMember.emitToGroup(
        completeVisibilityMembers,
        method,
        constructPayload(
          this.internalMap.get(
            ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
          )!,
          completeVisibilityMembers as TNonEmptyArray<ServerSessionMember>,
          ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        ),
      )
    }

    // Emit per-force events to force-specific (non-complete-visibility) members,
    // if any.
    this.internalMap.forEach((components, forceId) => {
      if (
        forceId !==
        ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY
      ) {
        let members = this.session.getMembersForForce(forceId, {
          limitedVisibilityOnly: true,
        })
        if (!members.length) return
        ServerSessionMember.emitToGroup(
          members,
          method,
          constructPayload(
            components,
            members as TNonEmptyArray<ServerSessionMember>,
            forceId,
          ),
        )
      }
    })
  }

  public emitMemberSpecific<
    TMethod extends TServerMethod,
    TPayloadData extends Omit<TServerEvents[TMethod], 'method'>,
  >(
    method: TMethod,
    constructPayload: (
      components: MissionComponentArray<TComponent>,
      member: ServerSessionMember,
      batchId: string,
    ) => TPayloadData,
  ): void {
    let completeVisibilityMembers =
      this.session.getMembersWithPermissions('completeVisibility')

    // Emit a force-agnostic event to all complete-visibility members,
    // if any.
    if (completeVisibilityMembers.length) {
      for (let member of completeVisibilityMembers) {
        member.emit(
          method,
          constructPayload(
            this.internalMap.get(
              ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
            )!,
            member,
            ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
          ),
        )
      }
    }

    // Emit per-force events to force-specific (non-complete-visibility) members,
    // if any.
    this.internalMap.forEach((components, forceId) => {
      if (
        forceId !==
        ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY
      ) {
        let members = this.session.getMembersForForce(forceId, {
          limitedVisibilityOnly: true,
        })
        for (let member of members) {
          member.emit(method, constructPayload(components, member, forceId))
        }
      }
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
