import React, { useRef, useState } from 'react'
import { IPage } from '../App'
import './HomePage.scss'
import Navigation from '../content/general-layout/Navigation'
import Notification from '../../notifications'
import Tooltip from '../content/communication/Tooltip'
import List, { ESortByMethod } from '../content/general-layout/List'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'
import { useMountHandler, useRequireSession } from 'src/toolbox/hooks'
import GameClient from 'src/games'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { AxiosError } from 'axios'
import ClientUser from 'src/users'

export interface IHomePage extends IPage {}

/**
 * This will render the home page.
 * @note This is the first page
 * that the user will see when they log in. It will display
 * a list of missions that the user can select from to play.
 * It will also display a list of users that the user can
 * select from to edit if they have proper permissions.
 */
export default function HomePage(props: IHomePage): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    beginLoading,
    finishLoading,
    goToPage,
    handleError,
    notify,
    logout,
    createPrompt,
  } = globalContext.actions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [missions, setMissions] = useState<ClientMission[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])

  /* -- COMPONENT EFFECTS -- */
  // Require session for page.
  const [session] = useRequireSession()

  // Grab the current user from the session.
  let { user: currentUser } = session

  const [mountHandled, remount] = useMountHandler(async (done) => {
    if (currentUser.isAuthorized('READ')) {
      await loadMissions()
    }

    // The current user in the session
    // must have restricted access to
    // view the users.
    if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
      await loadUsers()
      await sortUsers()
    }

    finishLoading()
    done()
  })

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
        setUsers(await ClientUser.fetchAll())
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

  /**
   * This sorts the users by their user ID.
   * @note If the first character is a letter it will sort the users alphabetically.
   * @note If the first character is a number it will sort the users numerically.
   * @note If the first character is a letter and the last character is a number it will sort the users by length.
   * @example sortedArray = ['1', '2', '3', 'a', 'b', 'c', 'a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3']
   */
  const sortUsers = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Sort users by their user ID.
        setUsers((users) => {
          return users.sort((a: ClientUser, b: ClientUser) => {
            // Compares the first character of the user ID
            // so that it can be sorted alphabetically or
            // numerically. It also compares the length of
            // the user ID to properly sort userID's that
            // start with a letter and end with a number.
            // (i.e., [ student1, ... student9, student10 ])
            if (
              a.userID[0] <= b.userID[0] &&
              a.userID.length <= b.userID.length
            ) {
              return -1
            } else if (
              a.userID[0] >= b.userID[0] &&
              a.userID.length >= b.userID.length
            ) {
              return 1
            } else {
              return 0
            }
          })
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

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

      if (files.length > 0 && currentUser.isAuthorized('WRITE')) {
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
  const createMission = (): void => {
    if (currentUser.isAuthorized('WRITE')) {
      goToPage('MissionFormPage', { missionID: null })
    }
  }

  // This will switch to the changelog
  // page.
  const viewChangelog = (): void => {
    if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
      goToPage('ChangelogPage', {})
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
        // Go to the game page with the new
        // game client.
        goToPage('GamePage', { game })
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
  const selectUser = (user: ClientUser) => {
    if (currentUser.isAuthorized(['READ', 'WRITE'])) {
      goToPage('UserFormPage', {
        userID: user.userID,
      })
    }
  }

  // This will switch to the user form
  // page with a new user.
  const createUser = () => {
    if (currentUser.isAuthorized('WRITE')) {
      goToPage('UserFormPage', {
        userID: null,
      })
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  // Class names used for styling based on the
  // current user's role.
  let homePageClassName: string = 'HomePage Page FullView'

  if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    homePageClassName += ' InstructorView'
  }

  // Require mount to be handled for
  // component to render.
  if (!mountHandled) {
    return null
  }

  /* -- RENDER -- */

  return (
    <div
      className={homePageClassName}
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* -- FILE DROP BOX -- */}
      <div className='FileDropBox'>
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
      <div className='Content'>
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
                      session={session}
                      handleSuccessfulCopy={remount}
                      handleSuccessfulDeletion={remount}
                    />
                  </div>
                </>
              )
            }}
            searchableProperties={['name']}
            noItemsDisplay={
              <div className='NoContent'>No missions available...</div>
            }
            ajaxStatus={'Loaded'}
            applyItemStyling={() => {
              return {}
            }}
            listSpecificItemClassName='AltDesign1'
          />
          <div className='EditContentRow'>
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
        <div className='UserListContainer'>
          <List<ClientUser>
            headingText={'Select a user:'}
            items={users}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(user: ClientUser) => {
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
            ajaxStatus={'Loaded'}
            applyItemStyling={() => {
              return {}
            }}
            listSpecificItemClassName='AltDesign1'
          />
          <div className='EditContentRow'>
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
        <div className='Version' onClick={viewChangelog} draggable={false}>
          v1.3.6
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
