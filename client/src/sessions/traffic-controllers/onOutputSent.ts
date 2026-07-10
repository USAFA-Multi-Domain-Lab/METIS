import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when an output has been sent.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onOutputSent = createClientSessionController<'output-sent'>(
  function (this, member, event) {
    // Extract data.
    let { key } = event.data

    switch (key) {
      case 'pre-execution':
        let { nodeId } = event.data
        let node = this.subscribedMission.getNodeById(nodeId)
        node?.onOutput()
    }
  },
)
