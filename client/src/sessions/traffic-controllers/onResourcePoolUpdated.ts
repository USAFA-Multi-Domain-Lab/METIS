import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when a resource pool is modified.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onResourcePoolUpdated =
  createClientSessionController<'resource-pool-updated'>(
    function (this, member, event) {
      let { lookUpData, operand } = event.data
      for (let lookUpDatum of lookUpData) {
        let pool = this.subscribedMission.lookUpPool(lookUpDatum)
        pool?.onModify(operand)
      }
    },
  )
