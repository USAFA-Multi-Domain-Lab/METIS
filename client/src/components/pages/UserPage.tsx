import {
  useGlobalContext,
  useNavigationMiddleware,
} from '@client/context/global'
import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import {
  useBeforeunload,
  useEventListener,
  useMountHandler,
  useRequireLogin,
} from '@client/toolbox/hooks'
import { UNMODIFIED_KEYSTROKES } from '@client/toolbox/keyboard'
import { ClientUser } from '@client/users/ClientUser'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { AxiosError } from 'axios'
import React, { useRef, useState } from 'react'
import type { TPage_P } from '.'
import { DefaultPageLayout } from '.'
import UserEntry from '../content/edit-user/UserEntry'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import { HomeButton, ProfileButton } from '../content/general-layout/Navigation'
import type { TButtonTextDisabled } from '../content/user-controls/buttons/ButtonText'
import { ButtonText } from '../content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import './UserPage.scss'

/**
 * Shown when the username belongs to a user that is still active.
 */
export const USERNAME_TAKEN_ERROR_MESSAGE: string =
  'This username is already taken.'

/**
 * Shown when the username belongs to a user that has been archived,
 * which keeps the username reserved.
 */
export const USERNAME_ARCHIVED_ERROR_MESSAGE: string =
  'This username has been archived and is no longer available.'

/**
 * Context for the user page, which will help distribute
 * user page properties to its children.
 */
const userPageContext = new LocalContext<TUserPage_P, {}, TUserPage_S, {}>()

/**
 * Hook used by UserPage-related components to access
 * the user-page context.
 */
export const useUserPageContext = userPageContext.getHook()

/**
 * Renders a page for managing users.
 */
export default function UserPage(props: TUserPage_P): TReactElement | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    prompt,
    navigateTo,
  } = globalContext.actions
  const { isAuthorized } = useRequireLogin()

  /* -- REFS -- */

  const root = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLFormElement>(null)

  /* -- STATE -- */

  const state: TUserPage_S = {
    existsInDatabase: useState<boolean>(props.userId !== null),
    usernameError: useState<string>(''),
    updatePassword: useState<boolean>(false),
    areUnsavedChanges: useState<boolean>(false),
  }
  const [existsInDatabase, setExistsInDatabase] = state.existsInDatabase
  const [user, setUser] = useState<ClientUser>(
    ClientUser.createNew({ passwordIsRequired: true }),
  )
  const [areUnsavedChanges, setAreUnsavedChanges] = state.areUnsavedChanges
  const [updatePassword] = state.updatePassword
  const [usernameError, setUsernameError] = state.usernameError
  const [savePromptOpen, setSavePromptOpen] = useState<boolean>(false)

  const navigationButtonEngine = useButtonSvgEngine({
    elements: [
      HomeButton(),
      ProfileButton({ middleware: async () => await enforceSavePrompt() }),
    ],
  })

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    let { userId } = props

    // Handle the editing of an existing user.
    if (userId !== null && isAuthorized('users_read_students')) {
      try {
        beginLoading('Loading user...')
        setUser(await ClientUser.$fetchOne(userId))
      } catch {
        handleError('Failed to load user.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  // Guards against refreshing or navigating away
  // with unsaved changes.
  useBeforeunload((event) => {
    if (areUnsavedChanges) {
      event.preventDefault()
    }
  })

  // Navigation middleware to protect from navigating
  // away with unsaved changes.
  useNavigationMiddleware(
    (to, next) => enforceSavePrompt().then(next),
    [areUnsavedChanges, usernameError, user.canSave],
  )

  // Save the user when enter is pressed away from the form. Enter inside
  // the form submits it without any help, and the save prompt sits above
  // the page rather than inside it, so its keystrokes belong to it.
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (!UNMODIFIED_KEYSTROKES.enter.matches(event)) return
    if (savePromptOpen) return
    if (form.current?.contains(event.target as Node)) return

    event.preventDefault()
    form.current?.requestSubmit()
  })

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navigationButtonEngine }
  })

  /**
   * Whether a username that cannot be used is currently entered.
   */
  const hasUsernameError = compute<boolean>(() =>
    StringToolbox.isFilled(usernameError),
  )

  /**
   * Whether the save button is disabled.
   */
  const saveDisabled = compute<TButtonTextDisabled>(() =>
    !areUnsavedChanges || hasUsernameError || !user.canSave ? 'full' : 'none',
  )

  /* -- FUNCTIONS -- */

  /**
   * This is called to save any changes made.
   * @resolves A boolean which is true if the user was saved, and false
   * otherwise.
   */
  const save = async (): Promise<boolean> => {
    if (saveDisabled !== 'none') return false

    /**
     * Reports a failed create or update to the user and returns the
     * form to its unsaved state so the changes can be retried.
     */
    const handleSaveError = (error: unknown) => {
      // A username held by another user, whether that user is active or
      // archived, is reported as a conflict by the unique index.
      if (error instanceof AxiosError && error.response?.status === 409) {
        notify('This user already exists. Try using a different username.')
        setUsernameError(USERNAME_TAKEN_ERROR_MESSAGE)
      } else {
        notify('User failed to save.')
      }
      finishLoading()
      setAreUnsavedChanges(true)
    }

    setAreUnsavedChanges(false)
    setUsernameError('')

    if (!existsInDatabase && isAuthorized('users_write_students')) {
      try {
        beginLoading('Creating user...')
        await ClientUser.$create(user)
        notify('User successfully saved.')
        finishLoading()
        setExistsInDatabase(true)
        navigateTo('HomePage', {}, { bypassMiddleware: true })
        return true
      } catch (error) {
        handleSaveError(error)
        return false
      }
    } else if (existsInDatabase && isAuthorized('users_write_students')) {
      try {
        beginLoading('Updating user...')
        setUser(
          await ClientUser.$update(user, {
            passwordIsRequired: updatePassword,
          }),
        )
        notify('User successfully saved.')
        finishLoading()
        navigateTo('HomePage', {}, { bypassMiddleware: true })
        return true
      } catch (error) {
        handleSaveError(error)
        return false
      }
    }

    return false
  }

  /**
   * This is called when the user form is submitted, which happens
   * when the save button is clicked and when enter is pressed
   * while a field has focus.
   */
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    save()
  }

  /**
   * Ensures any unsaved changes are addressed before
   * any further action is taken.
   * @resolves If the user either saves or discards the changes.
   * If the user cancels, the promise will never resolve.
   * @example
   * ```typescript
   * const saveSensitiveOperation = async () => {
   *   // Enforce the save prompt, only allowing
   *   // this function to perform its operation
   *   // once any unsaved changes, if there any,
   *   // are addressed.
   *   await enforceSavePrompt()
   *
   *   // Then, perform the sensitive operation.
   *   // If the user cancels the save prompt, this
   *   // code will never be reached.
   *   // ...
   * }
   * ```
   */
  const enforceSavePrompt = async (): Promise<void> => {
    // A user who cannot write has nothing to save, so there is
    // nothing to address.
    if (!isAuthorized('users_write_students')) return
    if (!areUnsavedChanges) return

    // Offering a save that cannot happen would leave the changes gone
    // without ever being saved, so the choice is only there when the
    // form is ready for it.
    let changesCanBeSaved: boolean = saveDisabled === 'none'
    let choices: Array<'Cancel' | 'Save' | 'Discard'> = changesCanBeSaved
      ? ['Cancel', 'Save', 'Discard']
      : ['Cancel', 'Discard']
    let message: string = changesCanBeSaved
      ? 'You have unsaved changes. What do you want to do with them?'
      : "You have unsaved changes that cannot be saved because there's at least one field that doesn't meet its requirements.\n\n" +
        'Cancel to finish, or discard your changes and continue.'

    setSavePromptOpen(true)
    const { choice } = await prompt(message, choices)
    setSavePromptOpen(false)

    // Cancelling calls off whatever the prompt stood in the way of, so
    // this is left unsettled and the caller never carries on.
    if (choice === 'Cancel') return new Promise<void>(() => {})

    // If the user opted to save, then save the user.
    if (choice === 'Save') {
      beginLoading('Saving...')
      let saved = await save()
      finishLoading()

      // The changes are still there when the save does not happen, so
      // whatever the prompt stood in the way of is called off the same
      // way cancelling calls it off.
      if (!saved) return new Promise<void>(() => {})
    }
  }

  /* -- RENDER -- */

  if (!mountHandled || !isAuthorized('users_read_students')) {
    return null
  }

  return (
    <LocalContextProvider
      context={userPageContext}
      defaultedProps={props}
      computed={{}}
      state={state}
      elements={{}}
    >
      <div className='UserPage Page' ref={root}>
        <DefaultPageLayout navigation={navigation}>
          <form
            className='Form'
            onSubmit={handleSubmit}
            autoComplete='off'
            ref={form}
          >
            <UserEntry
              user={user}
              handleChange={() => setAreUnsavedChanges(true)}
            />
            <div className='Buttons'>
              <ButtonText
                type='submit'
                text={'Save'}
                disabled={saveDisabled}
                onClick={() => {}}
              />
            </div>
          </form>
        </DefaultPageLayout>
      </div>
    </LocalContextProvider>
  )
}

/* ---------------------------- TYPES FOR USER PAGE ---------------------------- */

/**
 * Props for the UserPage component.
 */
export type TUserPage_P = TPage_P & {
  /**
   * The ID of the user to display.
   * @note If this is null, then a new user is being created.
   */
  userId: string | null
}

/**
 * The state for `UserPage`, provided in the context.
 */
export type TUserPage_S = {
  /**
   * Whether the user exists in the database.
   */
  existsInDatabase: TReactState<boolean>
  /**
   * The message explaining why the entered username cannot be used,
   * or an empty string when the username is usable. Set by the
   * availability check on the username field and by a rejected save.
   */
  usernameError: TReactState<string>
  /**
   * Whether or not the user's password is being updated.
   */
  updatePassword: TReactState<boolean>
  /**
   * Whether or not there are unsaved changes.
   */
  areUnsavedChanges: TReactState<boolean>
}
