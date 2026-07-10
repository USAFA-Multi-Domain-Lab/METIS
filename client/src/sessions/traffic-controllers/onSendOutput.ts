import { ClientOutput } from '@client/missions/forces/ClientOutput'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when an output has been sent.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onSendOutput = createClientSessionController<'send-output'>(
  function (this, member, event) {
    let { outputData } = event.data
    let { forceId } = outputData
    let force = this.subscribedMission.getForceById(forceId)
    if (force) {
      let output = new ClientOutput(force, outputData)
      force.storeOutput(output)
    }
  },
)
