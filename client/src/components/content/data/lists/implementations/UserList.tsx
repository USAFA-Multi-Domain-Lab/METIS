import Prompt from 'src/components/content/communication/Prompt'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DateToolbox } from '../../../../../../../shared/toolbox/dates'
import List, { TGetListButtonLabel, TOnListButtonClick } from '../List'
import {
  TGetItemButtonLabel,
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
  const { user: currentUser, isAuthorized } = useRequireLogin()
  const { notify, beginLoading, finishLoading, navigateTo, prompt, logout } =
    globalContext.actions

  /* -- COMPUTED -- */

  /**
   * The list buttons to display based on permissions.
   */
  const listButtons = compute<TMetisIcon[]>(() => {
    let results: TMetisIcon[] = []

    // If the user has the proper authorization, add
    // the add button.
    if (isAuthorized('users_write_students')) {
      results.push('add')
    }

    return results
  })

  /**
   * The item buttons to display based on permissions.
   */
  const itemButtons = compute<TMetisIcon[]>(() => {
    let results: TMetisIcon[] = []

    // Add the open button.
    results.push('open')

    // If the user has the proper authorization, add
    // the launch, copy, remove, and download buttons.
    if (isAuthorized('users_write_students')) {
      results.push('remove')
    }

    return results
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to delete a user.
   */
  const onDeleteRequest = async (user: ClientUser) => {
    let isSelf = user.username === currentUser.username
    let promptMessage = isSelf
      ? `Please confirm the deletion of your account.` +
        `\t\n` +
        `***Note: This will log you out afterwards.***`
      : 'Please confirm the deletion of this user.'

    // Prompt the user for confirmation.
    let { choice } = await prompt(promptMessage, Prompt.ConfirmationChoices)

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting user...')
        await ClientUser.$delete(user._id)
        // If the user is deleting their own account,
        // log them out.
        if (isSelf) {
          beginLoading('Logging out...')
          await logout()
        }
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
      case 'createdAt':
        return 'Created'
      case 'updatedAt':
        return 'Last Modified'
      case 'createdByUsername':
        return 'Created By'
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
      case 'createdAt':
      case 'updatedAt':
        let datetime = user[column]
        if (datetime === null) return 'N/A'
        else return DateToolbox.format(datetime, 'yyyy-mm-dd HH:MM')
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
  const getUserListButtonTooltip: TGetListButtonLabel = (button) => {
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
  const getUserItemButtonTooltip: TGetItemButtonLabel<ClientUser> = (
    button,
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
    if (isAuthorized('users_write_students')) {
      navigateTo('UserPage', { userId })
    }
  }

  /**
   * Callback for when a list-specific button in the
   * user list is clicked.
   */
  const onUserListButtonClick: TOnListButtonClick = (button) => {
    switch (button) {
      case 'add':
        if (isAuthorized('users_write_students')) {
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
      columns={[
        'username',
        'access',
        'createdAt',
        'updatedAt',
        'createdByUsername',
      ]}
      listButtonIcons={listButtons}
      itemButtonIcons={itemButtons}
      getColumnLabel={getUserColumnLabel}
      getCellText={getUserCellText}
      getColumnWidth={getUserColumnWidth}
      getItemTooltip={() => 'Open user'}
      getListButtonLabel={getUserListButtonTooltip}
      getItemButtonLabel={getUserItemButtonTooltip}
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
