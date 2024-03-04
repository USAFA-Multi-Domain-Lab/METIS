import { AxiosError } from 'axios'
import React, { useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import { useMountHandler, useRequireSession } from 'src/toolbox/hooks'
import { EAjaxStatus } from '../../../../shared/toolbox/ajax'
import User from '../../../../shared/users'
import Notification from '../../notifications'
import { IPage } from '../App'
import Tooltip from '../content/communication/Tooltip'
import List, { ESortByMethod } from '../content/general-layout/List'
import Navigation from '../content/general-layout/Navigation'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'
import './HomePage.scss'

export interface IHomePage extends IPage {}

export default function HomePage(props: IHomePage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    beginLoading,
    finishLoading,
    navigateTo,
    handleError,
    notify,
    logout,
    createPrompt,
  } = globalContext.actions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [missions, setMissions] = useState<Array<ClientMission>>([])
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
        beginLoading('Retrieving missions...')
        // Fetch missions from API and store
        // them in the state.
        setMissions(await ClientMission.fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve missions.')
        finishLoading()
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
        beginLoading('Retrieving users...')
        // Fetch users from API and store
        // them in the state.
        // setUsers(await User.fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve users.')
        finishLoading()
        reject(error)
      }
    })
  }

  /* -- COMPONENT EFFECTS -- */

  const [mountHandled, remount] = useMountHandler(async (done) => {
    await loadMissions()
    await loadUsers()
    finishLoading()
    done()
  })

  // Require session for page.
  const [session] = useRequireSession()

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Return null if the mount has
  // not been handled or if the
  // session is null.
  if (!mountHandled || session === null) {
    return null
  }

  let { user: currentUser } = session

  /* -- COMPONENT FUNCTIONS (CONTINUED) -- */

  // This will import files as missions.
  const importMissionFiles = async (files: FileList) => {
    let validFiles: Array<File> = []
    let successfulImportCount = 0
    let invalidContentsCount = 0
    let invalidFileExtensionCount: number = 0
    let serverErrorFailureCount: number = 0
    let invalidContentsErrorMessages: Array<{
      fileName: string
      errorMessage: string
    }> = []

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
          notify(
            `Successfully imported ${successfulImportCount} mission${
              successfulImportCount === 1 ? '' : 's'
            }.`,
          )
        }
        // Notifies of files that were valid
        // to upload but failed due to a server
        // error.
        if (serverErrorFailureCount) {
          notify(
            `An unexpected error occurred while importing ${serverErrorFailureCount} file${
              serverErrorFailureCount !== 1 ? 's' : ''
            }.`,
          )
        }
        // Notifies of failed uploads.
        if (invalidContentsCount > 0) {
          let notification: Notification = notify(
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

                    invalidContentsErrorMessages.forEach(
                      ({ errorMessage, fileName }) => {
                        prompt += `**${fileName}**\n`
                        prompt += `\`\`\`\n`
                        prompt += `${errorMessage}\n`
                        prompt += `\`\`\`\n`
                      },
                    )
                    notification.dismiss()
                    createPrompt(prompt)
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
          // notify(
          //   `${invalidFileExtensionCount} of the files uploaded did not have the .metis extension and therefore ${
          //     invalidFileExtensionCount === 1 ? 'was' : 'were'
          //   } rejected.`,
          // )
        }
      }

      // Reloads missions now that all files
      // have been processed.
      loadMissions().then(loadMissionsCallback).catch(loadMissionsCallback)
    }

    // Switch to load screen.
    beginLoading(
      '', //`Importing ${files.length} file${files.length === 1 ? '' : 's'}...`,
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

    // Import the files.
    ClientMission.import(validFiles)
      .then(({ successfulImportCount, failedImportCount, errorMessages }) => {
        // Update counts and error messages
        // based on the result.
        successfulImportCount += successfulImportCount
        invalidContentsCount += failedImportCount
        invalidContentsErrorMessages = errorMessages
        handleFileImportCompletion()
      })
      .catch((error) => {
        if (error instanceof AxiosError) {
          serverErrorFailureCount += validFiles.length
          handleFileImportCompletion()
        }
      })
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
    navigateTo('MissionFormPage', { missionID: null })

  // This will switch to the changelog
  // page.
  const viewChangelog = (): void => {
    if (currentUser.hasRestrictedAccess) {
      navigateTo('ChangelogPage', {})
    }
  }

  /**
   * Callback for when a mission is selected.
   */
  const handleMissionSelection = async (mission: ClientMission) => {
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
        // Update session data to include new
        // game ID.
        session.gameID = game.gameID
        // Go to the game page with the new
        // game client.
        navigateTo('GamePage', { game })
      } catch (error) {
        handleError({
          message: 'Failed to launch game. Contact system administrator.',
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
      navigateTo('UserFormPage', {
        userID: user.userID,
      })
    }
  }

  const createUser = () => {
    navigateTo('UserFormPage', {
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
            handleClick: () =>
              logout({
                returningPagePath: 'HomePage',
                returningPageProps: {},
              }),
            key: 'log-out',
          },
        ]}
      />
      {/* -- CONTENT -- */}
      <div className={contentClassName}>
        {/* { Mission List } */}
        <div className='MissionListContainer'>
          <List<ClientMission>
            headingText={'Select a mission:'}
            items={missions}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(mission: ClientMission) => {
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
              onClick={createMission}
              tooltipDescription={'Create new mission'}
              uniqueClassName={'NewMissionButton'}
            />
            <ButtonSVG
              purpose={EButtonSVGPurpose.Upload}
              onClick={handleMissionImportRequest}
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
              onClick={createUser}
              tooltipDescription={'Create new user'}
            />
          </div>
        </div>
      </div>
      <div className='Join'>
        <label style={{ paddingRight: '1em' }}>Jacob Don't Forget:</label>
        <input
          style={{ color: 'black' }}
          type='text'
          onKeyUp={async (event) => {
            if (event.key === 'Enter') {
              let game = await GameClient.join(
                (event.target as HTMLInputElement).value,
                server!,
              )
              navigateTo('GamePage', { game })
            }
          }}
        />
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
