import { useState } from 'react'
import { IPage } from '../App'
import CreateUserEntry from '../content/edit-user/CreateUserEntry'
import EditUserEntry from '../content/edit-user/EditUserEntry'
import Navigation from '../content/general-layout/Navigation'
import './UserFormPage.scss'
import { useMountHandler, useRequireSession } from 'src/toolbox/hooks'
import { useGlobalContext } from 'src/context'
import { AxiosError } from 'axios'
import ClientUser from 'src/users'

export interface IUserFormPage extends IPage {
  // If this is null, then a new user is being created.
  userID: string | null
}

export enum EUserFormPurpose {
  Create,
  Update,
}

export default function UserFormPage(props: IUserFormPage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    goToPage,
    confirm,
    logout,
    isAuthorized,
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

  const [mountHandled] = useMountHandler(async (done) => {
    let userID: string | null = props.userID
    let existsInDatabase: boolean = userID !== null

    // Handle the editing of an existing user.
    if (existsInDatabase) {
      try {
        beginLoading('Loading user...')
        setUser(await ClientUser.fetchOne(userID!))
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

  // Require session.
  const [session] = useRequireSession()

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Require session, mount to be handled,
  // and for the current user to have
  // restricted access.
  if (
    session === null ||
    !mountHandled ||
    !isAuthorized(['READ', 'WRITE', 'DELETE'])
  ) {
    return null
  }

  /* -- COMPONENT FUNCTIONS -- */

  // This is called to save any changes
  // made.
  const save = async (): Promise<void> => {
    if (areUnsavedChanges) {
      setAreUnsavedChanges(false)
      setUsernameAlreadyExists(false)

      if (!existsInDatabase && isAuthorized(['WRITE'])) {
        try {
          let resultingUser = await ClientUser.create(user)
          notify('User successfully saved.')
          setUser(resultingUser)
          setExistsInDatabase(true)
        } catch (error: any) {
          if (error instanceof AxiosError && error.response?.status === 409) {
            notify(
              'This username already exists. Try using a different username.',
            )
            setUsernameAlreadyExists(true)
          } else {
            notify('User failed to save.')
          }
          setAreUnsavedChanges(true)
        }
      } else if (existsInDatabase && isAuthorized(['WRITE'])) {
        try {
          await ClientUser.update(user)
          notify('User successfully saved.')
        } catch (error: any) {
          notify('User failed to save.')
          setAreUnsavedChanges(true)
        }
      }
    }
  }

  // This will redirect the user to the
  // home page.
  const goHome = (): void => {
    if (!areUnsavedChanges) {
      goToPage('HomePage', {})
    } else {
      confirm(
        'You have unsaved changes. What do you want to do with them?',
        async (concludeAction: () => void) => {
          try {
            await save()
            goToPage('HomePage', {})
            concludeAction()
          } catch (error: any) {
            concludeAction()
          }
        },
        {
          handleAlternate: (concludeAction: () => void) => {
            goToPage('HomePage', {})
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
  let userFormPurpose: EUserFormPurpose

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
    userFormPurpose = EUserFormPurpose.Create
  } else if (existsInDatabase && !user.passwordIsRequired) {
    userFormPurpose = EUserFormPurpose.Update
  } else {
    throw new Error(
      `Purpose for form page could not be determined.\nExists in database: "${existsInDatabase}"\nPassword is required: "${user.passwordIsRequired}"`,
    )
  }

  const renderUserEntry = (): JSX.Element | null => {
    if (userFormPurpose === EUserFormPurpose.Create) {
      return (
        <CreateUserEntry
          user={user}
          userEmptyStringArray={userEmptyStringArray}
          usernameAlreadyExists={usernameAlreadyExists}
          setUserEmptyStringArray={setUserEmptyStringArray}
          handleChange={handleChange}
        />
      )
    } else if (userFormPurpose === EUserFormPurpose.Update) {
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
