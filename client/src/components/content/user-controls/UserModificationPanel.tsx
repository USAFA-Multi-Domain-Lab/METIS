import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import ClientUser from 'src/users'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Prompt from '../communication/Prompt'
import ButtonSvgPanel, { TValidPanelButton } from './ButtonSvgPanel'
import './UserModificationPanel.scss'

/**
 * Renders a panel of svg buttons used for modifying a user.
 */
export default function UserModificationPanel({
  user,
  onSuccessfulDeletion,
}: TUserModificationPanel): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { notify, prompt, finishLoading } = globalContext.actions
  const [session] = globalContext.session

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Require session.
  if (session === null) {
    return null
  }

  // Extract properties from session.
  let { user: currentUser } = session

  /* -- FUNCTIONS -- */
  /**
   * Handles a request to delete a user.
   */
  const onDeleteRequest = async () => {
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Please confirm the deletion of this user.',
      Prompt.ConfirmationChoices,
    )

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
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
  }

  /* -- COMPUTED -- */
  /**
   * A list of available buttons for the mission modification panel.
   */
  const availableButtons: SingleTypeObject<TValidPanelButton> = compute(() => {
    return {
      remove: {
        icon: 'remove',
        key: 'remove',
        onClick: onDeleteRequest,
        tooltipDescription: 'Remove user.',
      },
    }
  })
  /**
   * The current buttons being displayed.
   */
  const currentButtons: TValidPanelButton[] = compute(() => {
    let buttons: TValidPanelButton[] = []

    if (currentUser.isAuthorized('users_write' || 'users_write_students')) {
      buttons = [availableButtons.remove]
    }

    return buttons
  })

  /* -- RENDER -- */

  // If the user is authorized to modify users,
  // then display the user modification panel.
  if (currentUser.isAuthorized('users_write' || 'users_write_students')) {
    return (
      <div className='UserModificationPanel'>
        <ButtonSvgPanel buttons={currentButtons} size={'small'} />
      </div>
    )
  } else {
    return null
  }
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
