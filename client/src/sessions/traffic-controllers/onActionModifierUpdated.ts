import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when an action modifier is applied to one or more actions.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onActionModifierUpdated = createClientSessionController<
  | 'action-process-time-updated'
  | 'action-resource-cost-updated'
  | 'action-success-chance-updated'
>(function (this, member, event) {
  let { lookUpData, modifier } = event.data

  for (let lookUpDatum of lookUpData) {
    let action = this.subscribedMission.lookUpAction(lookUpDatum)
    action?.onModify(modifier)
  }
})
