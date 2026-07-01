import { createServerSessionController } from './createServerSessionController'

/**
 * Acknowledges a session panel alert by viewing the panel.
 * @param member The session member acknowledging the alert.
 * @param event The acknowledge event.
 */
export const onAcknowledgeSessionPanelAlert =
  createServerSessionController<'acknowledge-session-panel-alert'>(
    function (this, member, event) {
      if (event.data.panel === 'Messenger') {
        this.clearUnreadChatCount(member._id, event.data.channelId)

        if (!this.hasPendingUnreadChatMessages(member._id)) {
          this.clearSessionPanelAlert(member, 'Messenger')
        }
      } else {
        this.clearSessionPanelAlert(member, event.data.panel)
      }
    },
  )
