import { useStore } from 'react-context-hook'
import { deleteUser, TMetisSession, User } from '../../../modules/users'
import { AppActions } from '../../AppState'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './UserModificationPanel.scss'
import { useRequireSession } from 'src/modules/hooks'

export default function UserModificationPanel(props: {
  user: User
  appActions: AppActions
  handleSuccessfulDeletion: () => void
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */
  const [session] = useStore<TMetisSession>('session')

  /* -- COMPONENT EFFECTS -- */

  /* -- COMPONENT VARIABLES -- */

  let user: User = props.user
  let appActions: AppActions = props.appActions
  let currentActions: MiniButtonSVG[] = []
  let handleSuccessfulDeletion = props.handleSuccessfulDeletion

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Require session.
  if (session === null) {
    return null
  }

  // Extract properties from session.
  let { user: currentUser } = session

  /* -- COMPONENT FUNCTIONS -- */
  // This is called when a user requests
  // to delete the mission.

  const handleDeleteRequest = () => {
    appActions.confirm(
      'Are you sure you want to delete this user?',
      (concludeAction: () => void) => {
        concludeAction()
        appActions.beginLoading('Deleting user...')

        if (user.userID) {
          deleteUser(
            user.userID,
            () => {
              appActions.finishLoading()
              appActions.notify(`Successfully deleted ${user.userID}.`)
              handleSuccessfulDeletion()
            },
            () => {
              appActions.finishLoading()
              appActions.notify(`Failed to delete ${user.userID}.`)
            },
          )
        }
      },
      {
        pendingMessageUponConfirm: 'Deleting...',
      },
    )
  }

  /* -- PRE-RENDER PROCESSING -- */

  let availableMiniActions = {
    remove: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Remove,
      handleClick: handleDeleteRequest,
      tooltipDescription: 'Remove user.',
    }),
  }

  let containerClassName: string = 'UserModificationPanel hidden'

  if (currentUser.hasRestrictedAccess) {
    containerClassName = 'UserModificationPanel'
  }

  currentActions.push(availableMiniActions.remove)

  /* -- RENDER -- */

  return (
    <div className={containerClassName}>
      <MiniButtonSVGPanel buttons={currentActions} linkBack={null} />
    </div>
  )
}
