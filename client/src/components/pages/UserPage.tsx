import { AxiosError } from 'axios'
import { useState } from 'react'
import { useGlobalContext, useNavigationMiddleware } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useMountHandler, useRequireLogin } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultPageLayout, TPage_P } from '.'
import CreateUserEntry from '../content/edit-user/CreateUserEntry'
import EditUserEntry from '../content/edit-user/EditUserEntry'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import {
  ButtonText,
  TButtonTextDisabled,
} from '../content/user-controls/buttons/ButtonText'
import './UserPage.scss'

/**
 * Renders a page for creating or editing a user.
 */
export default function UserPage({ userId }: IUserPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    prompt,
    navigateTo,
    logout,
  } = globalContext.actions

  /* -- COMPONENT STATE -- */

  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
  const [user, setUser] = useState<ClientUser>(
    new ClientUser({}, { passwordIsRequired: true }),
  )
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<string[]>([])
  const [usernameAlreadyExists, setUsernameAlreadyExists] =
    useState<boolean>(false)

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    let existsInDatabase: boolean = userId !== null

    // Handle the editing of an existing user.
    if (existsInDatabase && currentUser.isAuthorized('users_read_students')) {
      try {
        beginLoading('Loading user...')
        setUser(await ClientUser.$fetchOne(userId as string))
      } catch {
        handleError('Failed to load user.')
      }
    }

    // Finish loading.
    finishLoading()
    // Update existsInDatabase state.
    setExistsInDatabase(existsInDatabase)
    // Mark mount as handled.
    done()
  })

  // Navigation middleware to protect from navigating
  // away with unsaved changes.
  useNavigationMiddleware(
    async (to, next) => {
      // If there are unsaved changes, prompt the user.
      if (
        areUnsavedChanges &&
        currentUser.isAuthorized('users_write_students')
      ) {
        const { choice } = await prompt(
          'You have unsaved changes. What do you want to do with them?',
          ['Cancel', 'Save', 'Discard'],
        )

        try {
          // Abort if cancelled.
          if (choice === 'Cancel') {
            return
          }
          // Save if requested.
          else if (choice === 'Save') {
            beginLoading('Saving...')
            await save()
            finishLoading()
          }
        } catch (error) {
          return handleError({
            message: 'Failed to save mission.',
            notifyMethod: 'bubble',
          })
        }
      }

      // Call next.
      next()
    },
    [areUnsavedChanges],
  )

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { login } = useRequireLogin()

  // Grab the user currently logged in.
  const { user: currentUser } = login

  // Require mount to be handled for
  // component to render.
  if (!mountHandled) {
    return null
  }

  /* -- COMPUTED -- */

  /**
   * Logout link for navigation.
   */
  const logoutLink = compute(() => ({
    text: 'Log out',
    onClick: async () => {
      // If there are unsaved changes, prompt the user.
      if (areUnsavedChanges) {
        const { choice } = await prompt(
          'You have unsaved changes. What do you want to do with them?',
          ['Cancel', 'Save', 'Discard'],
        )

        try {
          // Abort if cancelled.
          if (choice === 'Cancel') {
            return
          }
          // Save if requested.
          else if (choice === 'Save') {
            beginLoading('Saving...')
            await save()
          }

          await logout()
        } catch (error) {
          return handleError({
            message: 'Failed to save mission.',
            notifyMethod: 'bubble',
          })
        }
      } else {
        await logout()
      }
    },
    key: 'logout',
  }))

  /**
   * Props for navigation.
   */
  const navigation: TNavigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), logoutLink],
      boxShadow: 'alt-7',
    }),
  )
  /**
   * Determines if the user form has any fields
   * with empty strings.
   */
  const isEmptyString: boolean = compute(() => userEmptyStringArray.length > 0)
  /**
   * The purpose of the user form.
   */
  const userFormPurpose: TUserFormPurpose = compute(() => {
    // If the user does not exist in the database
    // and the password is required, then the form
    // is for creating a new user.
    if (!existsInDatabase && user.passwordIsRequired) {
      return 'Create'
    }
    // Or, if the user exists in the database
    // and the password is not required, then
    // the form is for updating an existing user.
    else if (existsInDatabase && !user.passwordIsRequired) {
      return 'Update'
    }
    // Otherwise, throw an error.
    else {
      throw new Error(
        `Purpose for form page could not be determined.\nExists in database: "${existsInDatabase}"\nPassword is required: "${user.passwordIsRequired}"`,
      )
    }
  })

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

      if (
        !existsInDatabase &&
        currentUser.isAuthorized('users_write_students')
      ) {
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
      } else if (
        existsInDatabase &&
        currentUser.isAuthorized('users_write_students')
      ) {
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
   * This is called when a change is made that would require saving.
   */
  const handleChange = (): void => {
    setAreUnsavedChanges(true)
  }

  /**
   * This will render the user entry form
   * based on the user form purpose.
   */
  const renderUserEntry = (): JSX.Element | null => {
    if (userFormPurpose === 'Create') {
      return (
        <CreateUserEntry
          user={user}
          userEmptyStringArray={userEmptyStringArray}
          usernameAlreadyExists={usernameAlreadyExists}
          login={login}
          setUserEmptyStringArray={setUserEmptyStringArray}
          handleChange={handleChange}
        />
      )
    } else if (userFormPurpose === 'Update') {
      return (
        <EditUserEntry
          user={user}
          usernameAlreadyExists={usernameAlreadyExists}
          userEmptyStringArray={userEmptyStringArray}
          setUserEmptyStringArray={setUserEmptyStringArray}
          handleChange={handleChange}
        />
      )
    } else {
      return null
    }
  }

  /* -- RENDER -- */

  if (mountHandled && currentUser.isAuthorized('users_write_students')) {
    return (
      <div className='UserPage Page'>
        <DefaultPageLayout navigation={navigation}>
          <div className='Form'>
            {renderUserEntry()}

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
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR USER PAGE ---------------------------- */

/**
 * Props for the UserPage component.
 */
export interface IUserPage extends TPage_P {
  // If this is null, then a new user is being created.
  userId: string | null
}

/**
 * Types used to render the user form.
 */
export type TUserFormPurpose = 'Create' | 'Update'
