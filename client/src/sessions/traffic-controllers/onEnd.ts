import { createClientSessionController } from './createClientSessionController'

/**
 * Handles when the session is ended.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 * @note Intentionally a no-op: `onEnding` already sets state
 * to `'ending'` and cleans up listeners while this session is
 * still the correct target.
 */
export const onEnd = createClientSessionController<'session-ended'>(
  function (this, member, event) {},
)
