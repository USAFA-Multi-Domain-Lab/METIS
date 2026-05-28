import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { TServerEvents, TServerMethod } from '@shared/connect'
import { ServerSessionMember } from './ServerSessionMember'
import type { SessionServer } from './SessionServer'

/**
 * Many methods within {@link SessionServer} require emitting events
 * to clients based on a set of component IDs. This class batches
 * together component IDs for efficient emission to clients with
 * different visibility permissions.
 */
export class ComponentModifierBatchMap {
  /**
   * A map of force IDs to component IDs. The idea is that each
   * force ID indexes a batch of data that is relevant to that force.
   * Since many session members only have visibility into one force,
   * this allows us to emit events efficiently by only sending
   * relevant data to each force.
   */
  private internalMap: Map<string, string[]>

  /**
   * Reference to the session, which is needed to access members
   * for emitting events to clients.
   */
  private session: SessionServer

  /**
   * @param session The session instance, needed to access members for emitting events.
   * @param components The components to batch together for emission. These should all
   * be of the same type (e.g. all nodes or all actions) and should all belong to the
   * same session.
   */
  public constructor(
    session: SessionServer,
    components: Array<
      ServerMissionForce | ServerMissionNode | ServerMissionAction
    >,
  ) {
    this.session = session
    this.internalMap = new Map<string, string[]>([
      [
        ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        [],
      ],
    ])

    for (let component of components) {
      if (!this.internalMap.has(component.forceId)) {
        this.internalMap.set(component.forceId, [])
      }
      this.internalMap.get(component.forceId)!.push(component._id)
      this.internalMap
        .get(
          ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        )!
        .push(component._id)
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
    constructPayload: (componentIds: string[]) => TPayloadData,
  ): void {
    // Emit a force-agnostic event to all complete-visibility members.
    ServerSessionMember.emitToGroup(
      this.session.getMembersWithPermissions('completeVisibility'),
      method,
      constructPayload(
        this.internalMap.get(
          ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY,
        )!,
      ),
    )
    // Emit per-force events to force-specific (non-complete-visibility) members.
    this.internalMap.forEach((nodeIds, forceId) => {
      if (
        forceId !==
        ComponentModifierBatchMap.COMPONENT_MODIFIER_BATCH_COMPLETE_VISIBILITY
      ) {
        ServerSessionMember.emitToGroup(
          this.session.getMembersForForce(forceId, {
            limitedVisibilityOnly: true,
          }),
          method,
          constructPayload(nodeIds),
        )
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
