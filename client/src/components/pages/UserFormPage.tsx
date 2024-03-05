import { AxiosError } from 'axios'
import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { useMountHandler, useRequireSession } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { IPage } from '../App'
import CreateUserEntry from '../content/edit-user/CreateUserEntry'
import EditUserEntry from '../content/edit-user/EditUserEntry'
import Navigation from '../content/general-layout/Navigation'
import './UserFormPage.scss'

export interface IUserFormPage extends IPage {
  // If this is null, then a new user is being created.
  userID: string | null
}

export type TUserFormPurpose = 'Create' | 'Update'

export default function UserFormPage(props: IUserFormPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    navigateTo,
    confirm,
    logout,
  } = globalContext.actions

  /* -- COMPONENT STATE -- */
  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
  const [user, setUser] = useState<ClientUser>(
    new ClientUser({}, { passwordIsRequired: true }),
  )
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<
    Array<string>
  >([])
  const [usernameAlreadyExists, setUsernameAlreadyExists] =
    useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */

  // This will handle the mount of the
  // component.
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
        setUser(await ClientUser.fetchOne(userID as string))
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

  /* -- COMPONENT FUNCTIONS -- */

  // This is called to save any changes
  // made.
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)
      setUsernameAlreadyExists(false)

      if (!existsInDatabase && currentUser.isAuthorized('WRITE')) {
        try {
          let currentUserID: string = user.userID
          beginLoading('Creating user...')
          await ClientUser.create(user)
          setUser(await ClientUser.fetchOne(currentUserID))
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
          await ClientUser.update(user)
          setUser(await ClientUser.fetchOne(user.userID))
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

  // This will redirect the user to the
  // home page.
  const goHome = (): void => {
    if (!areUnsavedChanges) {
      navigateTo('HomePage', {})
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          try {
            await save()
            navigateTo('HomePage', {})
            concludeAction()
          } catch (error: any) {
            concludeAction()
          }
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            navigateTo('HomePage', {})
            concludeAction()
          },
          pendingMessageUponConfirm: 'Saving...',
          pendingMessageUponAlternate: 'Discarding...',
          buttonConfirmText: 'Save',
          buttonAlternateText: 'Discard',
        },
      )
    }
  }

  // Forces a rerender.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This is called when a change is
  // made that would require saving.
  const handleChange = (): void => {
    setAreUnsavedChanges(true)
    forceUpdate()
  }

  /* -- RENDER -- */

  let isEmptyString: boolean = userEmptyStringArray.length > 0
  let userFormPurpose: TUserFormPurpose

  // This will gray out the save button
  // if there are no unsaved changes or
  // if there are empty strings or if
  // the user does not have permission
  // to save.
  let grayOutSaveButton: boolean =
    !areUnsavedChanges || isEmptyString || !user.canSave

  let saveButtonClassName: string = 'Button'

  if (grayOutSaveButton) {
    saveButtonClassName += ' Disabled'
  }

  // Determine user form purpose.
  if (!existsInDatabase && user.passwordIsRequired) {
    userFormPurpose = 'Create'
  } else if (existsInDatabase && !user.passwordIsRequired) {
    userFormPurpose = 'Update'
  } else {
    throw new Error(
      `Purpose for form page could not be determined.\nExists in database: "${existsInDatabase}"\nPassword is required: "${user.passwordIsRequired}"`,
    )
  }

  // Require mount to be handled and for
  // the current user to have restricted
  // access.
  if (!mountHandled || !currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    return null
  }

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

  return (
    <div className='UserFormPage Page'>
      {/* -- NAVIGATION -- */}
      <Navigation
        links={[
          {
            text: 'Done',
            handleClick: goHome,
            visible: true,
            key: 'done',
          },
          {
            text: 'Log out',
            handleClick: () =>
              logout({
                returningPagePath: 'HomePage',
                returningPageProps: {},
              }),
            visible: true,
            key: 'log-out',
          },
        ]}
        brandingCallback={goHome}
        brandingTooltipDescription='Go home.'
      />

      {/* -- CONTENT -- */}
      <div className='Content'>
        {renderUserEntry()}
        <div className='ButtonContainer'>
          <div className={saveButtonClassName} onClick={() => save()}>
            Save
          </div>
        </div>
      </div>

      {/* -- FOOTER -- */}
      <div className='FooterContainer'>
        <a
          href='https://www.midjourney.com/'
          className='Credit'
          draggable={false}
        >
          Photo by Midjourney
        </a>
      </div>
    </div>
  )
}
