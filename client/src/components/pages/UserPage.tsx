import { AxiosError } from 'axios'
import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { useMountHandler, useRequireSession } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout, TPage_P } from '.'
import CreateUserEntry from '../content/edit-user/CreateUserEntry'
import EditUserEntry from '../content/edit-user/EditUserEntry'
import {
  HomeLink,
  LogoutLink,
  TNavigation,
} from '../content/general-layout/Navigation'
import './UserPage.scss'

export default function UserPage(props: IUserPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { beginLoading, finishLoading, handleError, notify } =
    globalContext.actions

  /* -- STATE -- */
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
    let userID: string | null = props.userID
    let existsInDatabase: boolean = userID !== null

    // Handle the editing of an existing user.
    if (
      existsInDatabase &&
      currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])
    ) {
      try {
        beginLoading('Loading user...')
        setUser(await ClientUser.$fetchOne(userID as string))
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

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Require session.
  const [session] = useRequireSession()

  // Grab the current user from the session.
  const { user: currentUser } = session

  // Require mount to be handled for
  // component to render.
  if (!mountHandled) {
    return null
  }

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation: TNavigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext), LogoutLink(globalContext)],
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
   * This is used to gray out the save button if there are
   * no unsaved changes or if there are empty strings or if
   * the user does not have permission to save.
   */
  const grayOutSaveButton: boolean = compute(
    () => !areUnsavedChanges || isEmptyString || !user.canSave,
  )
  /**
   * The class name for the save button.
   */
  const saveButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If the save button should be grayed out,
    // add the 'Disabled' class name.
    if (grayOutSaveButton) {
      classList.push('Disabled')
    }

    // Return the class names as a single string.
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * This is called to save any changes made.
   */
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)
      setUsernameAlreadyExists(false)

      if (!existsInDatabase && currentUser.isAuthorized('WRITE')) {
        try {
          let currentUserID: string = user.userID
          beginLoading('Creating user...')
          await ClientUser.$create(user)
          setUser(await ClientUser.$fetchOne(currentUserID))
          notify('User successfully saved.')
          finishLoading()
          setExistsInDatabase(true)
        } catch (error: any) {
          if (error instanceof AxiosError && error.response?.status === 409) {
            notify(
              'This username already exists. Try using a different username.',
            )
            setUsernameAlreadyExists(true)
          } else {
            notify('User failed to save.', { errorMessage: true })
          }
          finishLoading()
          setAreUnsavedChanges(true)
        }
      } else if (existsInDatabase && currentUser.isAuthorized('WRITE')) {
        try {
          beginLoading('Updating user...')
          await ClientUser.$update(user)
          setUser(await ClientUser.$fetchOne(user.userID))
          notify('User successfully saved.')
          finishLoading()
        } catch (error: any) {
          notify('User failed to save.')
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
          session={session}
          setUserEmptyStringArray={setUserEmptyStringArray}
          handleChange={handleChange}
        />
      )
    } else if (userFormPurpose === 'Update') {
      return (
        <EditUserEntry
          user={user}
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

  if (mountHandled && currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    return (
      <div className='UserPage Page'>
        <DefaultLayout navigation={navigation}>
          <div className='Form'>
            {renderUserEntry()}
            <div className='ButtonContainer'>
              <div className={saveButtonClassName} onClick={() => save()}>
                Save
              </div>
            </div>
          </div>
        </DefaultLayout>
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
  userID: string | null
}

/**
 * Types used to render the user form.
 */
export type TUserFormPurpose = 'Create' | 'Update'
