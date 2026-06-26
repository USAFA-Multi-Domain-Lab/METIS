import { createServerSessionController } from './createServerSessionController'

/**
 * Fetches the current session panel alerts for a member.
 * @param member The requesting session member.
 */
export const onFetchSessionPanelAlerts =
  createServerSessionController<'fetch-session-panel-alerts'>(
    function (this, member, _event) {
      const panels = Array.from(
        this._pendingSessionPanelAlerts.get(member._id) ?? [],
      )
      if (panels.length) {
        member.emit('session-panel-alert', { data: { panels } })
      }
    },
  )
