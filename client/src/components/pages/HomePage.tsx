import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import Notification from 'src/notifications'
import { compute } from 'src/toolbox'
import {
  useMountHandler,
  useRequireSession,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout } from '.'
import { TGameBasicJson } from '../../../../shared/games'
import Tooltip from '../content/communication/Tooltip'
import { DetailString } from '../content/form/Form'
import List, { ESortByMethod } from '../content/general-layout/List'
import { LogoutLink } from '../content/general-layout/Navigation'
import ButtonSvg from '../content/user-controls/ButtonSvg'
import { ButtonText } from '../content/user-controls/ButtonText'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'
import './HomePage.scss'

/* -- constants -- */

const GAMES_SYNC_RATE: number = 1000

/* -- components -- */

/**
 * This will render the home page.
 * @note This is the first page
 * that the user will see when they log in. It will display
 * a list of missions that the user can select from to play.
 * It will also display a list of users that the user can
 * select from to edit if they have proper permissions.
 */
export default function HomePage(props: {}): JSX.Element | null {
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
    confirm,
  } = globalContext.actions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [games, setGames] = useState<TGameBasicJson[]>([])
  const [missions, setMissions] = useState<ClientMission[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])
  const [manualJoinGameId, setManualJoinGameId] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */
  // Require session for page.
  const [session] = useRequireSession()

  // Grab the current user from the session.
  let { user: currentUser } = session

  const [mountHandled, remount] = useMountHandler(async (done) => {
    if (currentUser.isAuthorized('READ')) {
      await loadGames()
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

    // Begin syncing games.
    setTimeout(() => syncGames.current(), GAMES_SYNC_RATE)

    done()
  })

  // On unmount, clear the sync games
  // interval.
  useUnmountHandler(() => {
    syncGames.current = async () => {}
  })

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => ({
    links: [LogoutLink(globalContext)],
    logoLinksHome: false,
  }))

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * This loads the missions into the state for display and selection.
   * @resolves When the games have been loaded.
   * @rejects If the games fail to load.
   */
  const loadGames = async (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving games...')
        // Fetch games from API and store
        // them in the state.
        setGames(await GameClient.$fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve games.')
        finishLoading()
        reject(error)
      }
    })
  }

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
        setMissions(await ClientMission.$fetchAll())
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
        setUsers(await ClientUser.$fetchAll())
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
   * Syncs the games periodically with the server.
   */
  const syncGames = useRef(async () => {
    try {
      // Fetch games from API and store
      // them in the state.
      setGames(await GameClient.$fetchAll())
    } catch {}

    setTimeout(() => syncGames.current(), GAMES_SYNC_RATE)
  })

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
                  onClick: () => {
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
    ClientMission.$import(validFiles)
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
      navigateTo('MissionPage', { missionID: null })
    }
  }

  /**
   * Handler for when a game is selected.
   */
  const onGameSelection = async (gameID: string) => {
    if (server !== null) {
      try {
        // Notify user of game join.
        beginLoading('Joining game...')
        // Join game from new game ID, awaiting
        // the promised game client.
        let game = await server.$joinGame(gameID)

        // If the game is not found, notify
        // the user and return.
        if (game === null) {
          handleError({
            message: 'Game could not be found.',
            notifyMethod: 'bubble',
          })
          finishLoading()
          return
        }

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

  /**
   * Handler for when a game is requested to
   * be deleted.
   */
  const onGameDelete = (game: TGameBasicJson) => {
    confirm(
      'Are you sure you want to delete this game?',
      async (concludeAction: () => void) => {
        try {
          beginLoading('Deleting game...')
          concludeAction()
          await GameClient.$delete(game.gameID)
          finishLoading()
          notify(`Successfully deleted "${game.name}".`)
          loadGames()
        } catch (error) {
          finishLoading()
          notify(`Failed to delete "${game.name}".`)
        }
      },
      {
        pendingMessageUponConfirm: 'Deleting game...',
      },
    )
  }

  /**
   * Handler for when a mission is selected.
   */
  const onMissionSelection = async ({ missionID }: ClientMission) => {
    navigateTo('MissionPage', { missionID })
  }

  // This will switch to the user form
  // page with the selected user.
  const selectUser = (user: ClientUser) => {
    if (currentUser.isAuthorized(['READ', 'WRITE'])) {
      navigateTo('UserPage', {
        userID: user.userID,
      })
    }
  }

  // This will switch to the user form
  // page with a new user.
  const createUser = () => {
    if (currentUser.isAuthorized('WRITE')) {
      navigateTo('UserPage', {
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

  /**
   * The file drop box for uploading mission files.
   */
  const fileDropBoxJsx = compute(() => (
    <div className='FileDropBox'>
      <div className='UploadIcon'></div>
    </div>
  ))

  /**
   * The games that are displayed on the home page.
   */
  const gamesJsx = compute(() => {
    // Gather details.
    let buttonsClasses: string[] = ['Buttons']

    // If the current user is not authorized
    // to write, hide the buttons.
    if (!currentUser.isAuthorized('WRITE')) {
      buttonsClasses.push('Hidden')
    }

    // Render JSX.
    return (
      <div className='GameListContainer'>
        <List<TGameBasicJson>
          headingText={'Select a game:'}
          items={games}
          sortByMethods={[ESortByMethod.Name]}
          nameProperty={'name'}
          alwaysUseBlanks={true}
          renderItemDisplay={(game: TGameBasicJson) => {
            return (
              <div className='SelectionRow'>
                <div
                  className='Text'
                  onClick={() => onGameSelection(game.gameID)}
                >
                  {game.name}
                  <Tooltip description='Join game.' />
                </div>
                <div className={buttonsClasses.join(' ')}>
                  <ButtonSvg
                    icon={'remove'}
                    size={'small'}
                    onClick={() => onGameDelete(game)}
                    tooltipDescription={'Remove game.'}
                  />
                </div>
              </div>
            )
          }}
          searchableProperties={['name']}
          noItemsDisplay={
            <div className='NoContent'>No games available...</div>
          }
          ajaxStatus={'Loaded'}
          applyItemStyling={() => {
            return {}
          }}
          listSpecificItemClassName='AltDesign1'
        />
        <div className='ListActions'>
          <div className='ManualJoin'>
            <div className='Label'>Enter game ID:</div>
            <DetailString
              fieldType='optional'
              handleOnBlur='none'
              label=''
              stateValue={manualJoinGameId}
              setState={setManualJoinGameId}
              uniqueLabelClassName={'Hidden'}
            />
            <ButtonText
              text='Join'
              onClick={() => onGameSelection(manualJoinGameId)}
              disabled={manualJoinGameId.length === 0}
            />
          </div>
        </div>
      </div>
    )
  })

  /**
   * The missions that are displayed on the home page.
   */
  const missionsJsx = compute(() => (
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
                  onClick={() => onMissionSelection(mission)}
                >
                  {mission.name}
                  <Tooltip description='View/edit mission.' />
                </div>
                <MissionModificationPanel
                  mission={mission}
                  onSuccessfulCopy={loadMissions}
                  onSuccessfulDeletion={loadMissions}
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
      <div className='ListActions'>
        <ButtonSvg
          icon={'add'}
          onClick={createMission}
          tooltipDescription={'Create new mission'}
          uniqueClassList={['NewMissionButton']}
        />
        <ButtonSvg
          icon={'upload'}
          onClick={handleMissionImportRequest}
          tooltipDescription={'Import a .metis file from your local system.'}
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
  ))

  /**
   * The users that are displayed on the home page.
   */
  const usersJsx = compute(() => (
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
                  onSuccessfulDeletion={remount}
                />
              </div>
            </>
          )
        }}
        searchableProperties={['userID']}
        noItemsDisplay={<div className='NoContent'>No users available...</div>}
        ajaxStatus={'Loaded'}
        applyItemStyling={() => {
          return {}
        }}
        listSpecificItemClassName='AltDesign1'
      />
      <div className='ListActions'>
        <ButtonSvg
          icon={'add'}
          onClick={createUser}
          tooltipDescription={'Create new user'}
        />
      </div>
    </div>
  ))

  // Render root element.
  return (
    <div
      className={homePageClassName}
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {fileDropBoxJsx}
      <DefaultLayout navigation={navigation}>
        {gamesJsx}
        {missionsJsx}
        {usersJsx}
      </DefaultLayout>
    </div>
  )
}
