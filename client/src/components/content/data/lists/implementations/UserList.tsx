import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import List, { TGetListButtonTooltip } from '../List'
import {
  TGetItemButtonTooltip,
  TOnItemButtonClick,
  TOnItemSelection,
} from '../pages/ListItem'

/**
 * A component for displaying a list of users.
 * @note Uses the `List` component.
 */
export default function UserList({
  users,
  onSuccessfulDeletion,
}: TUserList_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { login } = useRequireLogin()
  const { notify, beginLoading, finishLoading, navigateTo, prompt } =
    globalContext.actions

  /* -- COMPUTED -- */

  /**
   * The list buttons to display based on permissions.
   */
  const listButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // If the user has the proper authorization, add
    // the add button.
    if (login.user.isAuthorized('users_write_students')) {
      results.push('add')
    }

    return results
  })

  /**
   * The item buttons to display based on permissions.
   */
  const itemButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // Add the open button.
    results.push('open')

    // If the user has the proper authorization, add
    // the launch, copy, remove, and download buttons.
    if (login.user.isAuthorized('users_write_students')) {
      results.push('remove')
    }

    return results
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to delete a user.
   */
  const onDeleteRequest = async (user: ClientUser) => {
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Please confirm the deletion of this user.',
      Prompt.ConfirmationChoices,
    )

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting user...')
        await ClientUser.$delete(user._id)
        finishLoading()
        notify(`Successfully deleted ${user.username}.`)
        onSuccessfulDeletion(user)
      } catch (error: any) {
        finishLoading()
        notify(`Failed to delete ${user.username}.`)
      }
    }
  }

  /**
   * Gets the column label for a user list.
   * @param column The column for which to get the label.
   * @returns The label for the column.
   */
  const getUserColumnLabel = (column: keyof ClientUser): string => {
    switch (column) {
      case 'username':
        return 'Username'
      case 'access':
        return 'Access'
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the text for a user list cell.
   * @param user The user for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   */
  const getUserCellText = (
    user: ClientUser,
    column: keyof ClientUser,
  ): string => {
    switch (column) {
      case 'access':
        return user[column].name
      default:
        return user[column]?.toString() ?? 'None'
    }
  }

  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   */
  const getUserColumnWidth = (column: keyof ClientUser): string => {
    switch (column) {
      case 'access':
        return '6em'
      default:
        return '10em'
    }
  }

  /**
   * Gets the tooltip description for a user list button.
   */
  const getUserListButtonTooltip: TGetListButtonTooltip = (button) => {
    switch (button) {
      case 'add':
        return 'New user'
      default:
        return ''
    }
  }

  /**
   * Gets the tooltip description for a user item button.
   */
  const getUserItemButtonTooltip: TGetItemButtonTooltip<ClientUser> = (
    button,
    item,
  ) => {
    switch (button) {
      case 'open':
        return 'Open'
      case 'remove':
        return 'Delete'
      default:
        return ''
    }
  }

  /**
   * Handler for when a user is selected.
   */
  const onUserSelection: TOnItemSelection<ClientUser> = async ({
    _id: userId,
  }) => {
    if (login.user.isAuthorized('users_write_students')) {
      navigateTo('UserPage', { userId })
    }
  }

  /**
   * Callback for when a list-specific button in the
   * user list is clicked.
   */
  const onUserListButtonClick: TSvgPanelOnClick = (button) => {
    switch (button) {
      case 'add':
        if (login.user.isAuthorized('users_write_students')) {
          navigateTo('UserPage', {
            userId: null,
          })
        }
        break
      default:
        console.warn('Unknown button clicked in user list.')
        break
    }
  }

  /**
   * Callback for when a item-specific button in the
   * user list is clicked.
   */
  const onUserItemButtonClick: TOnItemButtonClick<ClientUser> = (
    button,
    user,
  ) => {
    switch (button) {
      case 'open':
        onUserSelection(user)
        break
      case 'remove':
        onDeleteRequest(user)
        break
      default:
        console.warn('Unknown button clicked in user list.')
        break
    }
  }

  // Render the list of users.
  return (
    <List<ClientUser>
      name={'Users'}
      items={users}
      columns={['username', 'access']}
      listButtons={listButtons}
      itemButtons={itemButtons}
      getColumnLabel={getUserColumnLabel}
      getCellText={getUserCellText}
      getColumnWidth={getUserColumnWidth}
      getItemTooltip={() => 'Open user'}
      getListButtonTooltip={getUserListButtonTooltip}
      getItemButtonTooltip={getUserItemButtonTooltip}
      onListButtonClick={onUserListButtonClick}
      onItemButtonClick={onUserItemButtonClick}
    />
  )
}

/**
 * Props for `UserList`.
 */
export type TUserList_P = {
  /**
   * The users to display.
   */
  users: ClientUser[]
  /**
   * Callback for a successful deletion event.
   * @param deletedUser The deleted user.
   */
  onSuccessfulDeletion: (deletedUser: ClientUser) => void
}
