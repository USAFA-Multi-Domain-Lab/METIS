import React, { useEffect, useRef, useState } from 'react'
import { getAllMissions, importMissions, Mission } from '../../modules/missions'
import { IPage } from '../App'
import './HomePage.scss'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import { ButtonText } from '../content/user-controls/ButtonText'
import Notification from '../../modules/notifications'
import Tooltip from '../content/communication/Tooltip'
import {
  getAllUsers,
  User,
  restrictedAccessRoles,
  userRoles,
  fullAccessRoles,
} from '../../modules/users'
import List, { ESortByMethod } from '../content/general-layout/List'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'

export interface IHomePage extends IPage {}

export default function HomePage(props: IHomePage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions
  let currentUser: User | null = appState.currentUser

  /* -- COMPONENT REFS -- */
  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [missions, setMissions] = useState<Array<Mission>>([])
  const [users, setUsers] = useState<Array<User>>([])

  /* -- COMPONENT EFFECTS -- */
  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      const handleLoadCompletion = () => setMountHandled(true)

      loadContent(handleLoadCompletion, handleLoadCompletion)
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  // This loads the content displayed in the
  // lists that are used for selection.
  const loadContent = (
    callback: () => void = () => {},
    callbackError: (error: Error) => void = () => {},
  ) => {
    appActions.beginLoading('Retrieving content...')

    // This loads the mission in session from the database
    // and stores it in a global state to be used on the GamePage
    // where the Mission Map renders
    getAllMissions(
      (missions: Array<Mission>) => {
        setMissions(missions)
        callback()
      },
      (error: Error) => {
        appActions.handleServerError('Failed to retrieve mission.')
        appActions.finishLoading()
        callbackError(error)
      },
    )

    if (
      currentUser &&
      currentUser.role &&
      restrictedAccessRoles.includes(currentUser.role)
    ) {
      // This loads all the users from the database
      getAllUsers(
        (retrievedUsers: Array<User>) => {
          let filteredUsers: Array<User> = []

          if (
            currentUser &&
            currentUser.role &&
            restrictedAccessRoles.includes(currentUser.role)
          ) {
            retrievedUsers.forEach((user: User) => {
              if (user.role === userRoles.Student) {
                filteredUsers.push(user)
              }
            })
            setUsers(filteredUsers)
          } else if (
            currentUser &&
            currentUser.role &&
            fullAccessRoles.includes(currentUser.role)
          ) {
            retrievedUsers.forEach((user: User) => {
              if (currentUser && user.userID !== currentUser.userID) {
                filteredUsers.push(user)
              }
            })
            setUsers(filteredUsers)
          }
          appActions.finishLoading()
          callback()
        },
        (error: Error) => {
          appActions.handleServerError('Failed to retrieve users.')
          appActions.finishLoading()
          callbackError(error)
        },
      )
    } else {
      appActions.finishLoading()
    }
  }

  // This will logout the current user.
  const logout = () =>
    appActions.logout({
      returningPagePath: 'HomePage',
      returningPageProps: {},
    })

  // This will import files as missions.
  const importMissionFiles = (files: FileList) => {
    let validFiles: Array<File> = []
    let successfulImportCount = 0
    let invalidContentsCount = 0
    let invalidFileExtensionCount: number = 0
    let serverErrorFailureCount: number = 0
    let invalidContentsErrorMessages: Array<{
      fileName: string
      errorMessage: string
    }> = []
    let contents_JSON: any

    // This is called when a file
    // import is processed, whether
    // successfully or unsuccessfully
    // uploaded.
    const handleFileImportCompletion = () => {
      // This is called after the missions
      // are reloaded to retrieve the newly
      // created missions.
      const loadMissionsCallback = () => {
        // Notifies of successful uploads.
        if (successfulImportCount > 0) {
          appActions.notify(
            `Successfully imported ${successfulImportCount} mission${
              successfulImportCount === 1 ? '' : 's'
            }.`,
          )
        }
        // Notifies of files that were valid
        // to upload but failed due to a server
        // error.
        if (serverErrorFailureCount) {
          appActions.notify(
            `An unexpected error occurred while importing ${serverErrorFailureCount} file${
              serverErrorFailureCount !== 1 ? 's' : ''
            }.`,
          )
        }
        // Notifies of failed uploads.
        if (invalidContentsCount > 0) {
          let notification: Notification = appActions.notify(
            `${invalidContentsCount} of the files uploaded did not have valid content and therefore ${
              invalidContentsCount === 1 ? 'was' : 'were'
            } rejected.`,
            {
              duration: null,
              buttons: [
                {
                  ...ButtonText.defaultProps,
                  text: 'View errors',
                  handleClick: () => {
                    let prompt: string = ''

                    for (let errorMessage of invalidContentsErrorMessages) {
                      prompt += `**${errorMessage.fileName}**\n`
                      prompt += `\`\`\`\n`
                      prompt += `${errorMessage.errorMessage}\n`
                      prompt += `\`\`\`\n`
                    }

                    notification.dismiss()
                    appActions.prompt(prompt)
                  },
                  componentKey: 'invalid-contents-view-errors',
                },
              ],
            },
          )
        }
        // Notifies of invalid files
        // rejected from being uploaded.
        if (invalidFileExtensionCount > 0) {
          appActions.notify(
            `${invalidFileExtensionCount} of the files uploaded did not have the .metis extension and therefore ${
              invalidFileExtensionCount === 1 ? 'was' : 'were'
            } rejected.`,
          )
        }
      }

      // Reloads missions now that all files
      // have been processed.
      loadContent(loadMissionsCallback, loadMissionsCallback)
    }

    // Switch to load screen.
    appActions.beginLoading(
      `Importing ${files.length} file${files.length === 1 ? '' : 's'}...`,
    )

    // Iterates over files for upload.
    for (let file of files) {
      if (file.name.toLowerCase().endsWith('.cesar')) {
        // If a .cesar file, import it.
        validFiles.push(file)
      }
      // If a .metis file, import it.
      else if (file.name.toLowerCase().endsWith('.metis')) {
        validFiles.push(file)
      }
      // Else, don't.
      else {
        invalidFileExtensionCount++
      }
    }

    importMissions(
      validFiles,
      false,
      (
        successCount: number,
        failureCount: number,
        errorMessages: Array<{ fileName: string; errorMessage: string }>,
      ) => {
        successfulImportCount += successCount
        invalidContentsCount += failureCount
        invalidContentsErrorMessages = errorMessages
        handleFileImportCompletion()
      },
      (error: Error) => {
        serverErrorFailureCount += validFiles.length
        handleFileImportCompletion()
      },
    )
  }

  // This is a file is dropped onto the page.
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    let page_elm: HTMLDivElement | null = page.current

    if (page_elm !== null) {
      let files: FileList = event.dataTransfer.files

      page_elm.classList.remove('DropPending')

      if (
        files.length > 0 &&
        currentUser &&
        currentUser.role &&
        restrictedAccessRoles.includes(currentUser.role)
      ) {
        importMissionFiles(files)
      }
    }
  }

  // This is called when a user drags over
  // the page.
  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    let page_elm: HTMLDivElement | null = page.current

    if (page_elm !== null) {
      page_elm.classList.add('DropPending')
    }
  }

  // This is called when the user is
  // no longer dragging over the page.
  const handleFileDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    let page_elm: HTMLDivElement | null = page.current

    if (page_elm !== null) {
      page_elm.classList.remove('DropPending')
    }
  }

  // This is called when a request is made
  // to upload a file.
  const handleMissionImportRequest = (): void => {
    let importMissionTrigger_elm: HTMLInputElement | null =
      importMissionTrigger.current

    if (importMissionTrigger_elm) {
      importMissionTrigger_elm.click()
    }
  }

  // This is called when a change is made
  // to the mission import input element.
  const handleImportMissionTriggerChange = (): void => {
    let importMissionTrigger_elm: HTMLInputElement | null =
      importMissionTrigger.current

    // If files are found, upload
    // is begun.
    if (
      importMissionTrigger_elm &&
      importMissionTrigger_elm.files !== null &&
      importMissionTrigger_elm.files.length > 0
    ) {
      importMissionFiles(importMissionTrigger_elm.files)
    }
  }

  // This will start the process for
  // creating a new mission.
  const createMission = (): void =>
    appActions.goToPage('MissionFormPage', { missionID: null })

  // This will switch to the changelog
  // page.
  const viewChangelog = (): void => {
    if (
      currentUser &&
      currentUser.role &&
      restrictedAccessRoles.includes(currentUser.role)
    ) {
      appActions.goToPage('ChangelogPage', {})
    }
  }

  // This will switch to the game page
  // with the selected mission.
  const selectMission = (mission: Mission) => {
    let userRoleStringValues = Object.values(userRoles)

    if (
      currentUser &&
      currentUser.role &&
      userRoleStringValues.includes(currentUser.role)
    ) {
      appActions.goToPage('GamePage', {
        missionID: mission.missionID,
      })
    }
  }

  // This will switch to the user form
  // page with the selected user.
  const selectUser = (user: User) => {
    let userRoleStringValues = Object.values(userRoles)

    if (
      currentUser &&
      currentUser.role &&
      userRoleStringValues.includes(currentUser.role)
    ) {
      appActions.goToPage('UserFormPage', {
        userID: user.userID,
      })
    }
  }

  const createUser = () => {
    appActions.goToPage('UserFormPage', {
      userID: null,
    })
  }

  /* -- RENDER -- */

  // Class names used for styling based on the
  // current user's role.
  let contentClassName: string = 'Content'
  let selectionContentClassName: string = 'SelectionContent'
  let userListContainer: string = 'Hidden'
  let editContentClassName: string = 'EditContentRow'
  let fileDropBoxClassName: string = 'Hidden'
  let displayLogout: boolean = false
  let versionClassName: string = 'Version Disabled'

  if (currentUser) {
    displayLogout = true
  }

  if (
    currentUser &&
    currentUser.role &&
    restrictedAccessRoles.includes(currentUser.role)
  ) {
    contentClassName += ' InstructorView'
    selectionContentClassName = 'SelectionContent-list InstructorView'
    userListContainer = 'UserListContainer'
    editContentClassName += ' InstructorView'
    fileDropBoxClassName = 'FileDropBox'
    versionClassName = 'Version'
  }

  return (
    <div
      className='HomePage Page'
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* -- FILE DROP BOX -- */}
      <div className={fileDropBoxClassName}>
        <div className='UploadIcon'></div>
      </div>

      {/* -- NAVIGATION */}
      <Navigation
        brandingCallback={null}
        brandingTooltipDescription={null}
        links={[
          {
            text: 'Log out',
            handleClick: logout,
            visible: displayLogout,
            key: 'log-out',
          },
        ]}
      />
      {/* -- CONTENT -- */}
      <div className={contentClassName}>
        {/* { Mission List } */}
        <div className='MissionListContainer'>
          <List<Mission>
            headingText={'Select a mission:'}
            items={missions}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(mission: Mission) => {
              return (
                <>
                  <div className='SelectionRow'>
                    <div
                      className='Text'
                      onClick={() => selectMission(mission)}
                    >
                      {mission.name}
                      <Tooltip description='Launch mission.' />
                    </div>
                    <MissionModificationPanel
                      mission={mission}
                      appActions={appActions}
                      handleSuccessfulCopy={() => setMountHandled(false)}
                      handleSuccessfulDeletion={() => setMountHandled(false)}
                      handleSuccessfulToggleLive={() => {}}
                    />
                  </div>
                </>
              )
            }}
            searchableProperties={['name']}
            noItemsDisplay={
              <div className='NoContent'>No missions available...</div>
            }
            ajaxStatus={EAjaxStatus.Loaded}
            applyItemStyling={() => {
              return {}
            }}
            listSpecificItemClassName={selectionContentClassName}
          />
          <div className={editContentClassName}>
            <ButtonSVG
              purpose={EButtonSVGPurpose.Add}
              handleClick={createMission}
              tooltipDescription={'Create new mission'}
              uniqueClassName={'NewMissionButton'}
            />
            <ButtonSVG
              purpose={EButtonSVGPurpose.Upload}
              handleClick={handleMissionImportRequest}
              tooltipDescription={
                'Import a .metis file from your local system.'
              }
            />
            <input
              className='ImportMissionTrigger'
              type='file'
              ref={importMissionTrigger}
              onChange={handleImportMissionTriggerChange}
              hidden
            />
          </div>
        </div>
        {/* { User List } */}
        <div className={userListContainer}>
          <List<User>
            headingText={'Select a user:'}
            items={users}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(user: User) => {
              return (
                <>
                  <div className='SelectionRow'>
                    <div className='Text' onClick={() => selectUser(user)}>
                      {user.userID}
                      <Tooltip description='Select user.' />
                    </div>
                    <UserModificationPanel
                      user={user}
                      appActions={appActions}
                      handleSuccessfulDeletion={() => setMountHandled(false)}
                    />
                  </div>
                </>
              )
            }}
            searchableProperties={['userID']}
            noItemsDisplay={
              <div className='NoContent'>No users available...</div>
            }
            ajaxStatus={EAjaxStatus.Loaded}
            applyItemStyling={() => {
              return {}
            }}
            listSpecificItemClassName={selectionContentClassName}
          />
          <div className={editContentClassName}>
            <ButtonSVG
              purpose={EButtonSVGPurpose.Add}
              handleClick={createUser}
              tooltipDescription={'Create new user'}
            />
          </div>
        </div>
      </div>

      {/* -- FOOTER -- */}
      <div className='FooterContainer' draggable={false}>
        <div
          className={versionClassName}
          onClick={viewChangelog}
          draggable={false}
        >
          v1.3.1
          <Tooltip description={'View changelog.'} />
        </div>
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
