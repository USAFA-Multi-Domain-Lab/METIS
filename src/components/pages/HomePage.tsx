import React, { useCallback, useEffect, useRef, useState } from 'react'
import { importMissions, Mission } from '../../modules/missions'
import { IPage } from '../App'
import './HomePage.scss'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import { ButtonText } from '../content/user-controls/ButtonText'
import Notification from '../../modules/notifications'
import Tooltip from '../content/communication/Tooltip'
import { User } from '../../modules/users'
import List, { ESortByMethod } from '../content/general-layout/List'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'
import { useMountHandler, useRequireSession } from 'src/modules/hooks'
import { GameClient } from 'src/modules/games'
import ServerConnection from 'src/modules/connect/server-connect'

export interface IHomePage extends IPage {}

export default function HomePage(props: IHomePage): JSX.Element | null {
  /* -- COMPONENT PROPERTIES -- */

  const appState: AppState = props.appState
  const appActions: AppActions = props.appActions

  // Extract values from the app state.
  const { server } = appState
  const { beginLoading, finishLoading, goToPage, handleError } = appActions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [missions, setMissions] = useState<Array<Mission>>([])
  const [users, setUsers] = useState<Array<User>>([])

  /* -- COMPONENT FUNCTIONS -- */

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * This loads the missions into the state for display and selection.
   */
  const loadMissions = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        appActions.beginLoading('Retrieving missions...')
        // Fetch missions from API and store
        // them in the state.
        setMissions(await Mission.fetchAll())
        // Finish loading if not mounted.
        if (!mountHandled) {
          appActions.finishLoading()
        }
        resolve()
      } catch (error) {
        appActions.handleError('Failed to retrieve missions.')
        appActions.finishLoading()
        reject(error)
      }
    })
  }

  /**
   * This loads the users into the state for display and selection.
   */
  const loadUsers = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        appActions.beginLoading('Retrieving users...')
        // Fetch users from API and store
        // them in the state.
        setUsers(await User.fetchAll())
        // Finish loading if not mounted.
        if (!mountHandled) {
          appActions.finishLoading()
        }
        resolve()
      } catch (error) {
        appActions.handleError('Failed to retrieve users.')
        appActions.finishLoading()
        reject(error)
      }
    })
  }

  /* -- COMPONENT EFFECTS -- */

  const [mountHandled, remount] = useMountHandler(async (done) => {
    await loadMissions()
    await loadUsers()
    appActions.finishLoading()
    done()
  })

  // Require session for page.
  const [session] = useRequireSession(appState, appActions)

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Return null if the mount has
  // not been handled or if the
  // session is null.
  if (!mountHandled || session === null) {
    return null
  }

  let { user: currentUser } = session

  /* -- COMPONENT FUNCTIONS (CONTINUED) -- */

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
      loadMissions().then(loadMissionsCallback).catch(loadMissionsCallback)
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

      if (files.length > 0 && currentUser.hasRestrictedAccess) {
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
    if (currentUser.hasRestrictedAccess) {
      appActions.goToPage('ChangelogPage', {})
    }
  }

  /**
   * Callback for when a mission is selected.
   */
  const handleMissionSelection = async (mission: Mission) => {
    if (server !== null) {
      try {
        // Notify user of mission launch.
        beginLoading('Launching mission...')
        // Launch game from mission ID, awaiting
        // the promised game ID.
        let gameID: string = await GameClient.launch(mission.missionID)
        // Notify user of mission join.
        beginLoading('Joining mission...')
        // Join game from new game ID, awaiting
        // the promised game client.
        let game: GameClient = await GameClient.join(gameID, server)
        // Go to the game page with the new
        // game client.
        goToPage('GamePage', { game })
      } catch (error) {
        handleError({
          message: 'Failed to launch mission. Contact system administrator.',
          notifyMethod: 'page',
        })
      }
    } else {
      handleError({
        message: 'No server connection. Contact system administrator',
        notifyMethod: 'bubble',
      })
    }
  }

  // This will switch to the user form
  // page with the selected user.
  const selectUser = (user: User) => {
    if (currentUser.hasRestrictedAccess) {
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

  /* -- PRE-RENDER PROCESSING -- */

  // Class names used for styling based on the
  // current user's role.
  let contentClassName: string = 'Content'
  let selectionContentClassName: string = 'SelectionContent'
  let userListContainer: string = 'Hidden'
  let editContentClassName: string = 'EditContentRow'
  let fileDropBoxClassName: string = 'Hidden'
  let versionClassName: string = 'Version Disabled'

  if (currentUser.hasRestrictedAccess) {
    contentClassName += ' InstructorView'
    selectionContentClassName = 'SelectionContent-list InstructorView'
    userListContainer = 'UserListContainer'
    editContentClassName += ' InstructorView'
    fileDropBoxClassName = 'FileDropBox'
    versionClassName = 'Version'
  }

  /* -- RENDER -- */

  return (
    <div
      className='HomePage Page FullView'
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
                      onClick={() => handleMissionSelection(mission)}
                    >
                      {mission.name}
                      <Tooltip description='Launch mission.' />
                    </div>
                    <MissionModificationPanel
                      mission={mission}
                      appActions={appActions}
                      handleSuccessfulCopy={remount}
                      handleSuccessfulDeletion={remount}
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
                      handleSuccessfulDeletion={remount}
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
