import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import Notification from 'src/notifications'
import SessionClient from 'src/sessions'
import { compute } from 'src/toolbox'
import {
  useMountHandler,
  useRequireLogin,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout } from '.'
import { TSessionBasicJson } from '../../../../shared/sessions'
import Prompt from '../content/communication/Prompt'
import Tooltip from '../content/communication/Tooltip'
import { DetailString } from '../content/form/DetailString'
import List, { ESortByMethod } from '../content/general-layout/List'
import { LogoutLink } from '../content/general-layout/Navigation'
import ButtonSvg from '../content/user-controls/ButtonSvg'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../content/user-controls/ButtonSvgPanel'
import { ButtonText } from '../content/user-controls/ButtonText'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import UserModificationPanel from '../content/user-controls/UserModificationPanel'
import './HomePage.scss'

/* -- constants -- */

const SESSIONS_SYNC_RATE: number = 1000

/* -- components -- */

/**
 * This will render the home page.
 * @note This is the first page
 * that the user will see when they log in. It will display
 * a list of missions that the user can select from to play.
 * It will also display a list of users that the user can
 * select from to edit if they have proper permissions.
 */
export default function HomePage(): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const {
    beginLoading,
    finishLoading,
    navigateTo,
    handleError,
    notify,
    prompt,
  } = globalContext.actions

  /* -- REFS -- */
  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- STATE -- */
  const [sessions, setSessions] = useState<TSessionBasicJson[]>([])
  const [missions, setMissions] = useState<ClientMission[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])
  const [manualJoinSessionId, setManualJoinSessionId] = useState<string>('')

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const [login] = useRequireLogin()

  // Grab the user currently logged in.
  let { user: currentUser } = login

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled, remount] = useMountHandler(async (done) => {
    try {
      if (currentUser.isAuthorized(['sessions_read', 'missions_read'])) {
        await loadSessions()
        await loadMissions()
      }

      // The user currently logged in must
      // have restricted access to view the
      // users.
      if (currentUser.isAuthorized('users_read_students')) {
        await loadUsers()
      }

      finishLoading()

      // Begin syncing sessions.
      setTimeout(() => syncSessions.current(), SESSIONS_SYNC_RATE)
    } catch (error: any) {
      handleError('Failed to load data. Contact system administrator.')
    }

    done()
  })

  // On unmount, clear the sync sessions
  // interval.
  useUnmountHandler(() => {
    syncSessions.current = async () => {}
  })

  /* -- COMPUTED -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(() => ({
    links: [LogoutLink(globalContext)],
    logoLinksHome: false,
  }))

  /* -- FUNCTIONS -- */

  /**
   * This loads the missions into the state for display and selection.
   * @resolves When the sessions have been loaded.
   * @rejects If the sessions fail to load.
   */
  const loadSessions = (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving sessions...')
        // Fetch sessions from API and store
        // them in the state.
        setSessions(await SessionClient.$fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve sessions.')
        finishLoading()
        reject(error)
      }
    })
  }

  /**
   * This loads the missions into the state for display and selection.
   */
  const loadMissions = (): Promise<void> => {
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
  const loadUsers = (): Promise<void> => {
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
   * Syncs the sessions periodically with the server.
   */
  const syncSessions = useRef(async () => {
    try {
      // Fetch sessions from API and store
      // them in the state.
      setSessions(await SessionClient.$fetchAll())
    } catch {}

    setTimeout(() => syncSessions.current(), SESSIONS_SYNC_RATE)
  })

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
                    let message: string = ''

                    invalidContentsErrorMessages.forEach(
                      ({ errorMessage, fileName }) => {
                        message += `**${fileName}**\n`
                        message += `\`\`\`\n`
                        message += `${errorMessage}\n`
                        message += `\`\`\`\n`
                      },
                    )
                    notification.dismiss()
                    prompt(message, Prompt.AlertChoices)
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
    try {
      let response = await ClientMission.$import(validFiles)
      successfulImportCount += response.successfulImportCount
      invalidContentsCount += response.failedImportCount
      invalidContentsErrorMessages = response.failedImportErrorMessages
      handleFileImportCompletion()
    } catch (error: any) {
      if (error instanceof AxiosError) {
        serverErrorFailureCount += validFiles.length
        handleFileImportCompletion()
      }
    }
  }

  // This is a file is dropped onto the page.
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    let page_elm: HTMLDivElement | null = page.current

    if (page_elm !== null) {
      let files: FileList = event.dataTransfer.files

      page_elm.classList.remove('DropPending')

      if (files.length > 0 && currentUser.isAuthorized('missions_write')) {
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
    if (currentUser.isAuthorized('missions_write')) {
      navigateTo('MissionPage', { missionId: null })
    }
  }

  /**
   * Handler for when a session is selected.
   */
  const onSessionSelection = async (sessionId: string) => {
    if (server !== null) {
      try {
        // Notify user of session join.
        beginLoading('Joining session...')
        // Join session from new session ID, awaiting
        // the promised session client.
        let session = await server.$joinSession(sessionId)

        // If the session is not found, notify
        // the user and return.
        if (session === null) {
          handleError({
            message: 'Session could not be found.',
            notifyMethod: 'bubble',
          })
          finishLoading()
          return
        }

        // Update login information to include
        // the new session ID.
        login.sessionId = session._id
        // Go to the session page with the new
        // session client.
        navigateTo('SessionPage', { session })
      } catch (error: any) {
        handleError({
          message: error.message,
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
   * Handler for when a session is requested to
   * be deleted.
   */
  const onSessionDelete = async (session: TSessionBasicJson) => {
    // Confirm deletion.
    let { choice } = await prompt(
      'Please confirm the deletion of this session.',
      Prompt.ConfirmationChoices,
    )

    // If confirmed, delete session.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting session...')
        await SessionClient.$delete(session._id)
        finishLoading()
        notify(`Successfully deleted "${session.name}".`)
        loadSessions()
      } catch (error) {
        finishLoading()
        notify(`Failed to delete "${session.name}".`)
      }
    }
  }

  /**
   * Handler for when a mission is selected.
   */
  const onMissionSelection = async ({ _id: missionId }: ClientMission) => {
    if (currentUser.isAuthorized('missions_write')) {
      navigateTo('MissionPage', { missionId })
    }
  }

  /**
   * Callback for when a mission is successfully copied.
   * @param mission The new mission created.
   */
  const onMissionCopy = (mission: ClientMission) => {
    // Update mission state.
    setMissions([...missions, mission])
  }

  /**
   * Callback for when a mission is successfully deleted.
   * @param mission The mission that was deleted.
   */
  const onMissionDeletion = (mission: ClientMission) => {
    // Remove mission from state.
    setMissions(missions.filter(({ _id }) => _id !== mission._id))
  }

  // This will switch to the user form
  // page with the selected user.
  const selectUser = (user: ClientUser) => {
    if (currentUser.isAuthorized('users_write_students')) {
      navigateTo('UserPage', {
        userId: user._id,
      })
    }
  }

  // This will switch to the user form
  // page with a new user.
  const createUser = () => {
    if (currentUser.isAuthorized('users_write_students')) {
      navigateTo('UserPage', {
        userId: null,
      })
    }
  }

  /* -- RENDER -- */

  // If the page has not yet mounted, there
  // is nothing to render yet.
  if (!mountHandled) return null

  /**
   * The file drop box for uploading mission files.
   */
  const fileDropBoxJsx = compute(() => (
    <div
      className={
        currentUser.isAuthorized('missions_write') ? 'FileDropBox' : 'Hidden'
      }
    >
      <div className='UploadIcon'></div>
    </div>
  ))

  /**
   * The sessions that are displayed on the home page.
   */
  const sessionsJsx = compute(() => {
    if (currentUser.isAuthorized('sessions_read')) {
      return (
        <div className='ListContainer'>
          <List<TSessionBasicJson>
            headingText={'Select a session:'}
            items={sessions}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(session: TSessionBasicJson) => {
              /**
               * Class for accessibility element.
               */
              const accessibilityClass = compute((): string => {
                const classList = [
                  'Accessibility',
                  session.config.accessibility ??
                    SessionClient.DEFAULT_CONFIG.accessibility,
                ]
                return classList.join(' ')
              })
              /**
               * Buttons for selection row.
               */
              const buttons = compute((): TValidPanelButton[] => {
                let buttons: TValidPanelButton[] = []

                // If the current user is authorized
                // to write, add the button for creating
                // a new session.
                if (currentUser.isAuthorized('sessions_write')) {
                  buttons.push({
                    icon: 'remove',
                    key: 'remove',
                    onClick: () => onSessionDelete(session),
                    tooltipDescription: 'Remove session.',
                  })
                }

                return buttons
              })

              return (
                <div className='Row Select Session'>
                  <div className={accessibilityClass}>
                    <Tooltip
                      description={
                        '### Session ID Required\n*This session is not publicly accessible. One must have the session ID to join.*'
                      }
                    />
                  </div>
                  <div
                    className='Text'
                    onClick={() => onSessionSelection(session._id)}
                  >
                    {session.name}
                    <Tooltip description={'Join session.'} />
                  </div>
                  <ButtonSvgPanel buttons={buttons} size={'small'} />
                </div>
              )
            }}
            searchableProperties={['name']}
            noItemsDisplay={
              <div className='NoContent'>No sessions available...</div>
            }
            ajaxStatus={'Loaded'}
            applyItemStyling={() => {
              return {}
            }}
            listSpecificItemClassName='AltDesign1'
          />
          <div className='ListActions'>
            <div className='ManualJoin'>
              <div className='Label'>Session ID:</div>
              <DetailString
                fieldType='optional'
                handleOnBlur='none'
                label=''
                stateValue={manualJoinSessionId}
                setState={setManualJoinSessionId}
                uniqueLabelClassName={'Hidden'}
              />
              <ButtonText
                text='Join'
                onClick={() => onSessionSelection(manualJoinSessionId)}
                disabled={manualJoinSessionId.length === 0 ? 'full' : 'none'}
              />
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  })

  /**
   * The missions that are displayed on the home page.
   */
  const missionsJsx = compute(() => {
    if (currentUser.isAuthorized('missions_read')) {
      return (
        <div className='ListContainer'>
          <List<ClientMission>
            headingText={'Select a mission:'}
            items={missions}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'name'}
            alwaysUseBlanks={true}
            renderItemDisplay={(mission: ClientMission) => {
              if (currentUser.isAuthorized('missions_write')) {
                return (
                  <>
                    <div className='Row Select'>
                      <div
                        className='Text Select'
                        onClick={() => onMissionSelection(mission)}
                      >
                        {mission.name}
                        <Tooltip description='View/edit mission.' />
                      </div>
                      <MissionModificationPanel
                        mission={mission}
                        onSuccessfulCopy={onMissionCopy}
                        onSuccessfulDeletion={onMissionDeletion}
                      />
                    </div>
                  </>
                )
              } else {
                return (
                  <>
                    <div className='Row'>
                      <div className='Text'>{mission.name}</div>
                      <MissionModificationPanel
                        mission={mission}
                        onSuccessfulCopy={() => {}}
                        onSuccessfulDeletion={() => {}}
                      />
                    </div>
                  </>
                )
              }
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
      )
    }
  })

  /**
   * The users that are displayed on the home page.
   */
  const usersJsx = compute(() => {
    if (
      currentUser.isAuthorized(['users_read_students', 'users_write_students'])
    ) {
      return (
        <div className='ListContainer'>
          <List<ClientUser>
            headingText={'Select a user:'}
            items={users}
            sortByMethods={[ESortByMethod.Name]}
            nameProperty={'username'}
            alwaysUseBlanks={true}
            renderItemDisplay={(user: ClientUser) => {
              return (
                <>
                  <div className='Row Select'>
                    <div className='Text' onClick={() => selectUser(user)}>
                      {user.username}
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
            searchableProperties={['username']}
            noItemsDisplay={
              <div className='NoContent'>No users available...</div>
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
              onClick={createUser}
              tooltipDescription={'Create new user'}
            />
          </div>
        </div>
      )
    } else {
      return null
    }
  })

  // Render root element.
  return (
    <div
      className='HomePage Page'
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {fileDropBoxJsx}
      <DefaultLayout navigation={navigation}>
        {sessionsJsx}
        {missionsJsx}
        {usersJsx}
      </DefaultLayout>
    </div>
  )
}
