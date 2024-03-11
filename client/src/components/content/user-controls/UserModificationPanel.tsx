import { useGlobalContext } from 'src/context'
import ClientUser from 'src/users'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './UserModificationPanel.scss'

export default function UserModificationPanel(props: {
  user: ClientUser
  handleSuccessfulDeletion: () => void
}): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const { notify, confirm, beginLoading, finishLoading } = globalContext.actions
  const [session] = globalContext.session

  /* -- COMPONENT VARIABLES -- */

  let user: ClientUser = props.user
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
      async (concludeAction: () => void) => {
        concludeAction()
        beginLoading('Deleting user...')

        if (user.userID) {
          try {
            await ClientUser.$delete(user.userID)
            finishLoading()
            notify(`Successfully deleted ${user.userID}.`)
            handleSuccessfulDeletion()
          } catch (error: any) {
            finishLoading()
            notify(`Failed to delete ${user.userID}.`)
          }
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
      <MiniButtonSVGPanel buttons={currentActions} />
    </div>
  )
}
