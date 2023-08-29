import { useStore } from 'react-context-hook'
import { deleteUser, restrictedAccessRoles, User } from '../../../modules/users'
import { AppActions } from '../../AppState'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './UserModificationPanel.scss'

export default function UserModificationPanel(props: {
  user: User
  appActions: AppActions
  handleSuccessfulDeletion: () => void
}): JSX.Element {
  /* -- GLOBAL STATE -- */
  const [currentUser] = useStore<User | null>('currentUser')

  /* -- COMPONENT VARIABLES -- */
  let user: User = props.user
  let appActions: AppActions = props.appActions
  let currentActions: MiniButtonSVG[] = []
  let handleSuccessfulDeletion = props.handleSuccessfulDeletion

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

  // -- RENDER --

  let availableMiniActions = {
    remove: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Remove,
      handleClick: handleDeleteRequest,
      tooltipDescription: 'Remove user.',
    }),
  }

  let containerClassName: string = 'UserModificationPanel hidden'

  if (
    currentUser &&
    currentUser.role &&
    restrictedAccessRoles.includes(currentUser.role)
  ) {
    containerClassName = 'UserModificationPanel'
  }

  currentActions.push(availableMiniActions.remove)

  return (
    <div className={containerClassName}>
      <MiniButtonSVGPanel buttons={currentActions} linkBack={null} />
    </div>
  )
}
