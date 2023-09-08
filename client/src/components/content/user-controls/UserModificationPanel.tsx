import User, { deleteUser } from '../../../../../shared/users'
import { TMetisSession } from '../../../../../shared/sessions'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './UserModificationPanel.scss'
import { useGlobalContext } from 'src/context'

export default function UserModificationPanel(props: {
  user: User
  handleSuccessfulDeletion: () => void
}): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const { notify, confirm, beginLoading, finishLoading } = globalContext.actions
  const [session] = globalContext.session

  /* -- COMPONENT VARIABLES -- */

  let user: User = props.user
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
    confirm(
      'Are you sure you want to delete this user?',
      (concludeAction: () => void) => {
        concludeAction()
        beginLoading('Deleting user...')

        if (user.userID) {
          deleteUser(
            user.userID,
            () => {
              finishLoading()
              notify(`Successfully deleted ${user.userID}.`)
              handleSuccessfulDeletion()
            },
            () => {
              finishLoading()
              notify(`Failed to delete ${user.userID}.`)
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
