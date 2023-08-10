import { useEffect, useState } from 'react'
import {
  createUser,
  defaultUserProps,
  getUser,
  restrictedAccessRoles,
  saveUser,
  User,
} from '../../modules/users'
import { IPage } from '../App'
import AppState, { AppActions } from '../AppState'
import UserEntry from '../content/edit-user/UserEntry'
import Navigation from '../content/general-layout/Navigation'
import './UserFormPage.scss'

export interface IUserFormPage extends IPage {
  // If this is null, then a new user is being created.
  userID: string | null
}

export default function UserFormPage(props: IUserFormPage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<
    Array<string>
  >([])
  const [isDefaultUser, setIsDefaultUser] = useState<boolean>(false)

  /* -- COMPONENT EFFECTS -- */

  // Equivalent to componentDidMount()
  // and componentDidUpdate():
  useEffect(() => {
    // If the user is not logged in, then
    // redirect them to the login page.
    if (
      !appState.currentUser ||
      (appState.currentUser &&
        !restrictedAccessRoles.includes(appState.currentUser.role))
    ) {
      appActions.goToPage('AuthPage', {})
    }

    if (!mountHandled) {
      let existsInDatabase: boolean
      let userID: string | null = props.userID

      // Creating a new user.
      if (userID === null) {
        let user: User = new User(
          defaultUserProps.userID,
          defaultUserProps.firstName,
          defaultUserProps.lastName,
          defaultUserProps.role,
        )
        user.passwordIsRequired = true
        existsInDatabase = false
        setUser(user)
        setIsDefaultUser(true)
        setAreUnsavedChanges(false)
        setMountHandled(true)
      }
      // Editing an existing user.
      else {
        appActions.beginLoading('Loading user...')

        getUser(
          userID,
          (user: User) => {
            setUser(user)
            appActions.finishLoading()
          },
          () => {
            appActions.finishLoading()
            appActions.handleServerError('Failed to load user.')
          },
        )
        existsInDatabase = true
        setExistsInDatabase(existsInDatabase)
        setMountHandled(true)
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  if (
    user !== null &&
    appState.currentUser &&
    restrictedAccessRoles.includes(appState.currentUser.role)
  ) {
    /* -- COMPONENT FUNCTIONS -- */

    // This is called to save any changes
    // made.
    const save = (
      callback: () => void = () => {},
      callbackError: (error: Error) => void = () => {},
    ): void => {
      if (areUnsavedChanges) {
        setAreUnsavedChanges(false)

        if (!existsInDatabase) {
          createUser(
            user,
            (resultingUser: User) => {
              appActions.notify('User successfully saved.')
              setUser(resultingUser)
              setExistsInDatabase(true)
              callback()
            },
            (error: Error) => {
              appActions.notify('User failed to save')
              setAreUnsavedChanges(true)
              callbackError(error)
            },
          )
        } else {
          saveUser(
            user,
            () => {
              appActions.notify('User successfully saved.')
              callback()
            },
            (error: Error) => {
              appActions.notify('User failed to save.')
              setAreUnsavedChanges(true)
              callbackError(error)
            },
          )
        }
      }
    }

    // This will redirect the user to the
    // home page.
    const goHome = (): void => {
      if (!areUnsavedChanges) {
        appActions.goToPage('HomePage', {})
      } else {
        appActions.confirm(
          'You have unsaved changes. What do you want to do with them?',
          (concludeAction: () => void) => {
            save(
              () => {
                appActions.goToPage('HomePage', {})
                concludeAction()
              },
              () => {
                concludeAction()
              },
            )
          },
          {
            handleAlternate: (concludeAction: () => void) => {
              appActions.goToPage('HomePage', {})
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

    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'HomePage',
        returningPageProps: {},
      })

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
              handleClick: logout,
              visible: true,
              key: 'log-out',
            },
          ]}
          brandingCallback={goHome}
          brandingTooltipDescription='Go home.'
        />

        {/* -- CONTENT -- */}
        <div className='Content'>
          <UserEntry
            user={user}
            isDefaultUser={isDefaultUser}
            userEmptyStringArray={userEmptyStringArray}
            setUserEmptyStringArray={setUserEmptyStringArray}
            handleChange={handleChange}
          />
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
  } else {
    return null
  }
}
