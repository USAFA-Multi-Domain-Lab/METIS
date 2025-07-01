import { AxiosError } from 'axios'
import React, { useContext, useRef, useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useMountHandler, useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultPageLayout, TPage_P } from '.'
import UserEntry from '../content/edit-user/UserEntry'
import {
  HomeButton,
  LogoutButton,
  TNavigation_P,
} from '../content/general-layout/Navigation'
import {
  ButtonText,
  TButtonTextDisabled,
} from '../content/user-controls/buttons/ButtonText'
import { useButtonSvgEngine } from '../content/user-controls/buttons/v3/hooks'
import If from '../content/util/If'
import './UserPage.scss'

/**
 * Context for the user page, which will help distribute
 * user page properties to its children.
 */
const UserPageContext = React.createContext<TUserPageContextData | null>(null)

/**
 * Hook used by UserPage-related components to access
 * the user-page context.
 */
export const useUserPageContext = () => {
  const context = useContext(UserPageContext) as TUserPageContextData | null
  if (!context) {
    throw new Error(
      'useUserPageContext must be used within an user-page provider',
    )
  }
  return context
}

/**
 * Renders a page for managing users.
 */
export default function (props: TUserPage_P): JSX.Element | null {
  const Provider =
    UserPageContext.Provider as React.Provider<TUserPageContextData>

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

  /* -- STATE -- */

  const root = useRef<HTMLDivElement>(null)
  const state: TUserPage_S = {
    existsInDatabase: useState<boolean>(props.userId !== null),
    userEmptyStringArray: useState<string[]>([]),
    usernameAlreadyExists: useState<boolean>(false),
  }
  const [existsInDatabase, setExistsInDatabase] = state.existsInDatabase
  const [user, setUser] = useState<ClientUser>(
    ClientUser.createNew({ passwordIsRequired: true }),
  )
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [userEmptyStringArray] = state.userEmptyStringArray
  const [, setUsernameAlreadyExists] = state.usernameAlreadyExists
  const navButtonEngine = useButtonSvgEngine({
    elements: [
      HomeButton(),
      LogoutButton({ middleware: async () => await enforceSavePrompt() }),
    ],
  })

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    // Handle the editing of an existing user.
    if (existsInDatabase && isAuthorized('users_read_students')) {
      try {
        beginLoading('Loading user...')
        setUser(await ClientUser.$fetchOne(props.userId!))
      } catch {
        handleError('Failed to load user.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  // Navigation middleware to protect from navigating
  // away with unsaved changes.
  useNavigationMiddleware(
    (to, next) => enforceSavePrompt().then(next),
    [areUnsavedChanges],
  )

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine }
  })

  /**
   * Determines if the user form has any fields
   * with empty strings.
   */
  const isEmptyString: boolean = compute(() => userEmptyStringArray.length > 0)

  /**
   * Whether the save button is disabled.
   */
  const saveDisabled: TButtonTextDisabled = compute(() =>
    !areUnsavedChanges || isEmptyString || !user.canSave ? 'full' : 'none',
  )

  /* -- FUNCTIONS -- */

  /**
   * This is called to save any changes made.
   */
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)
      setUsernameAlreadyExists(false)

      if (!existsInDatabase && isAuthorized('users_write_students')) {
        try {
          beginLoading('Creating user...')
          await ClientUser.$create(user)
          notify('User successfully saved.')
          finishLoading()
          setExistsInDatabase(true)
          navigateTo('HomePage', {})
        } catch (error: any) {
          if (error instanceof AxiosError && error.response?.status === 409) {
            notify('This user already exists. Try using a different username.')
            setUsernameAlreadyExists(true)
          } else {
            notify('User failed to save.', { errorMessage: true })
          }
          finishLoading()
          setAreUnsavedChanges(true)
        }
      } else if (existsInDatabase && isAuthorized('users_write_students')) {
        try {
          beginLoading('Updating user...')
          setUser(await ClientUser.$update(user))
          notify('User successfully saved.')
          finishLoading()
        } catch (error: any) {
          if (error instanceof AxiosError && error.response?.status === 409) {
            notify('This user already exists. Try using a different username.')
            setUsernameAlreadyExists(true)
          } else {
            notify('User failed to save.', { errorMessage: true })
          }
          finishLoading()
          setAreUnsavedChanges(true)
        }
      }
    }
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
    return new Promise<void>(async (resolve, reject) => {
      // If the user does not have write permissions
      // and there are no unsaved changes, resolve immediately.
      if (!isAuthorized('users_write_students') && areUnsavedChanges) {
        return resolve()
      }

      // If there are unsaved changes, prompt the user.
      if (areUnsavedChanges) {
        const { choice } = await prompt(
          'You have unsaved changes. What do you want to do with them?',
          ['Cancel', 'Save', 'Discard'],
        )

        // If the user opted to save, then save
        // the mission.
        if (choice === 'Save') {
          beginLoading('Saving...')
          await save()
          finishLoading()
        }

        // Then, unless the user cancelled, resolve.
        if (choice !== 'Cancel') resolve()
      } else {
        resolve()
      }
    })
  }

  /**
   * This is called when a change is made that would require saving.
   */
  const handleChange = (): void => setAreUnsavedChanges(true)

  /* -- RENDER -- */

  /**
   * The value to provide to the context.
   */
  const contextValue: TUserPageContextData = {
    root,
    ...props,
    state,
  }

  return (
    <If condition={mountHandled && isAuthorized('users_read_students')}>
      <Provider value={contextValue}>
        <div className='UserPage Page' ref={root}>
          <DefaultPageLayout navigation={navigation}>
            <div className='Form'>
              <UserEntry user={user} handleChange={handleChange} />
              <div className='Buttons'>
                <ButtonText
                  text={'Save'}
                  disabled={saveDisabled}
                  onClick={() => save()}
                />
              </div>
            </div>
          </DefaultPageLayout>
        </div>
      </Provider>
    </If>
  )
}

/* ---------------------------- TYPES FOR USER PAGE ---------------------------- */

/**
 * Props for the UserPage component.
 */
export interface TUserPage_P extends TPage_P {
  // If this is null, then a new user is being created.
  userId: string | null
}

/**
 * The state for `UserPage`, provided
 * in the context.
 */
export type TUserPage_S = {
  /**
   * Whether the user exists in the database.
   */
  existsInDatabase: TReactState<boolean>
  /**
   * An array of fields with empty strings.
   */
  userEmptyStringArray: TReactState<string[]>
  /**
   * Whether or not the username already exists.
   */
  usernameAlreadyExists: TReactState<boolean>
}

/**
 * The user-page context data provided to all children
 * of `UserPage`.
 */
export type TUserPageContextData = {
  /**
   * The ref for the root element of the user page.
   */
  root: React.RefObject<HTMLDivElement>
} & Required<TUserPage_P> & {
    /**
     * The state for the user page.
     */
    state: TUserPage_S
  }
