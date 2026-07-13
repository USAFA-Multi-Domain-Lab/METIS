import { createServerSessionController } from './createServerSessionController'

/**
 * Called when a member requests to start the session.
 * @param member The member requesting to start the session.
 * @param event The event emitted by the member.
 */
export const onRequestStartSession =
  createServerSessionController<'request-start-session'>(
    async function (this, member, event) {
      await this.start(member, event)
    },
  )
