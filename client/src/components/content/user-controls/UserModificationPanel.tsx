import { useGlobalContext } from 'src/context'
import ClientUser from 'src/users'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import ButtonSvgPanel, { TValidPanelButton } from './ButtonSvgPanel'
import './UserModificationPanel.scss'

export default function UserModificationPanel({
  user,
  onSuccessfulDeletion,
}: TUserModificationPanel): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const { notify, confirm, beginLoading, finishLoading } = globalContext.actions
  const [session] = globalContext.session

  /* -- COMPONENT VARIABLES -- */

  let currentButtons: TValidPanelButton[] = []

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

  const onDeleteRequest = () => {
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
            onSuccessfulDeletion()
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

  let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
    remove: {
      icon: 'remove',
      key: 'remove',
      onClick: onDeleteRequest,
      tooltipDescription: 'Remove user.',
    },
  }

  let containerClassName: string = 'UserModificationPanel hidden'

  if (currentUser.hasRestrictedAccess) {
    containerClassName = 'UserModificationPanel'
  }

  currentButtons.push(availableMiniActions.remove)

  /* -- RENDER -- */

  return (
    <div className={containerClassName}>
      <ButtonSvgPanel buttons={currentButtons} size={'small'} />
    </div>
  )
}

/* -- types -- */

/**
 * Props for `UserModificationPanel` component.
 */
export type TUserModificationPanel = {
  /**
   * The user to modify.
   */
  user: ClientUser
  /**
   * Callback for successful deletion of the user.
   */
  onSuccessfulDeletion: () => void
}
