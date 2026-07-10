import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when a force is assigned to a member.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onForceAssigned = createClientSessionController<'force-assigned'>(
  function (this, member, event) {
    let { memberId, forceId } = event.data
    let target = this.getMember(memberId)
    if (target === undefined) {
      return console.warn(
        `Event "force-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    target.assignToForce(forceId)
  },
)
