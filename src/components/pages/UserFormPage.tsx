import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createUser,
  defaultUserProps,
  getUser,
  restrictedAccessRoles,
  saveUser,
  User,
} from '../../modules/users'
import { IPage } from '../App'
import { AppActions } from '../AppState'
import CreateUserEntry from '../content/edit-user/CreateUserEntry'
import EditUserEntry from '../content/edit-user/EditUserEntry'
import Navigation from '../content/general-layout/Navigation'
import './UserFormPage.scss'

export interface IUserFormPage extends IPage {
  // If this is null, then a new user is being created.
  userID: string | null
}

export enum EUserFormPurpose {
  Create,
  Update,
}

export default function UserFormPage(props: IUserFormPage): JSX.Element | null {
  let appActions: AppActions = props.appActions
  let userFormPurpose: EUserFormPurpose = EUserFormPurpose.Create
  let isDefaultUser: boolean = false

  /* -- GLOBAL STATE -- */
  const [currentUser] = useStore<User>('currentUser')

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [existsInDatabase, setExistsInDatabase] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [areUnsavedChanges, setAreUnsavedChanges] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [userEmptyStringArray, setUserEmptyStringArray] = useState<
    Array<string>
  >([])

  /* -- COMPONENT EFFECTS -- */

  // Equivalent to componentDidMount()
  // and componentDidUpdate():
  useEffect(() => {
    // If the user is not logged in, then
    // redirect them to the login page.
    if (
      currentUser === null ||
      (currentUser &&
        currentUser.role &&
        !restrictedAccessRoles.includes(currentUser.role))
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
          defaultUserProps.needsPasswordReset,
        )
        user.passwordIsRequired = true
        existsInDatabase = false
        setUser(user)
        isDefaultUser = true
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
    currentUser &&
    currentUser.role &&
    restrictedAccessRoles.includes(currentUser.role)
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

    if (user === defaultUserProps) {
      isDefaultUser = true
    }

    if (isDefaultUser && user.passwordIsRequired) {
      userFormPurpose = EUserFormPurpose.Create
    } else if (!isDefaultUser && !user.passwordIsRequired) {
      userFormPurpose = EUserFormPurpose.Update
    }

    const renderUserEntry = (): JSX.Element | null => {
      if (userFormPurpose === EUserFormPurpose.Create) {
        return (
          <CreateUserEntry
            user={user}
            userEmptyStringArray={userEmptyStringArray}
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
  } else {
    return null
  }
}
