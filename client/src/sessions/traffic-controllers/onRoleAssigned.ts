import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when a role is assigned to a member.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onRoleAssigned = createClientSessionController<'role-assigned'>(
  function (this, member, event) {
    let { memberId, roleId } = event.data
    let target = this.getMember(memberId)
    if (target === undefined) {
      return console.warn(
        `Event "role-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    target.assignToRole(roleId)
  },
)
