import { useGlobalContext } from '@client/context/global'
import { ClientFileReference } from '@client/files/ClientFileReference'
import { ClientMission } from '@client/missions/ClientMission'
import type { SessionBasic } from '@client/sessions/SessionBasic'
import { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import {
  useMountHandler,
  useRequireLogin,
  useUnmountHandler,
} from '@client/toolbox/hooks'
import { ClientUser } from '@client/users/ClientUser'
import { PromiseManager } from '@shared/toolbox/promises/PromiseManager'
import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { DefaultPageLayout } from '.'
import Prompt from '../content/communication/Prompt'
import FileReferenceList from '../content/data/lists/implementations/FileReferenceList'
import MissionList from '../content/data/lists/implementations/missions/MissionList'
import SessionList from '../content/data/lists/implementations/SessionList'
import UserList from '../content/data/lists/implementations/UserList'
import type { TNavigation_P } from '../content/general-layout/Navigation'
import { ProfileButton } from '../content/general-layout/Navigation'
import { useButtonSvgEngine } from '../content/user-controls/buttons/panels/hooks'
import Auth from '../content/util/Auth'
import './HomePage.scss'

/* -- CONSTANTS -- */

const SESSIONS_SYNC_RATE: number = 1000

/* -- COMPONENTS -- */

/**
 * This will render the home page.
 * @note This is the first page
 * that the user will see when they log in. It will display
 * a list of missions that the user can select from to play.
 * It will also display a list of users that the user can
 * select from to edit if they have proper permissions.
 */
export default function HomePage(): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const {
    beginLoading,
    finishLoading,
    handleError,
    notify,
    prompt,
    dismissNotification,
  } = globalContext.actions
  const [_, setLoadingProgress] = globalContext.loadingProgress
  const [sessions, setSessions] = useState<SessionBasic[]>([])
  const [missions, setMissions] = useState<ClientMission[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])
  const [fileReferences, setFileReferences] = useState<ClientFileReference[]>(
    [],
  )
  const navButtonEngine = useButtonSvgEngine({
    elements: [ProfileButton()],
  })

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { login } = useRequireLogin()

  // Grab the user currently logged in.
  const { user: currentUser } = login
  const { authorize } = currentUser

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
    try {
      let promiseManager = new PromiseManager([], { authUser: currentUser })

      // Initiate loading of any data that the
      // current user is authorized to view.
      promiseManager.authorize(['sessions_read'], loadSessions)
      promiseManager.authorize(['missions_read'], loadMissions)
      promiseManager.authorize(['users_read_students'], loadUsers)
      promiseManager.authorize(['files_read'], loadFiles)

      // Wait for all data to be loaded.
      await promiseManager.all()

      // Begin syncing sessions, if authorized.
      authorize('sessions_read', () =>
        setTimeout(() => syncSessions.current(), SESSIONS_SYNC_RATE),
      )
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
   * This loads the files into the state for display and selection.
   */
  const loadFiles = (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving files...')
        // Fetch files from API and store
        // them in the state.
        setFileReferences(await ClientFileReference.$fetchAll())
        // Finish loading and resolve.
        finishLoading()
        resolve()
      } catch (error) {
        handleError('Failed to retrieve files.')
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

  /**
   * Imports the given files as missions.
   * @param files The files to import.
   * @resolves When the files have been processed
   * and imported if valid.
   */
  const importMissionFiles = async (files: FileList) => {
    let validFiles: File[] = []
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
          const notification = notify(
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
                    // Dismiss the notification.
                    dismissNotification(notification._id)
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
          notify(
            `${invalidFileExtensionCount} of the files uploaded did not have the .metis.zip extension and therefore ${
              invalidFileExtensionCount === 1 ? 'was' : 'were'
            } rejected.`,
          )
        }
      }

      // Reloads missions and files now that all files
      // have been processed.
      loadMissions()
        .then(loadFiles)
        .then(loadMissionsCallback)
        .catch(loadMissionsCallback)
    }

    // Switch to load screen.
    beginLoading(
      `Importing ${files.length} file${files.length === 1 ? '' : 's'}...`,
    )

    // Iterates over files for upload, determining
    // if they are valid or not.
    for (let file of files) {
      let regex = /^.*\.metis$|^.*\.cesar$|^.*\.metis.zip$/
      if (regex.test(file.name.toLowerCase())) validFiles.push(file)
      else invalidFileExtensionCount++
    }

    // Import the files.
    try {
      let response = await ClientMission.$import(validFiles, {
        onImportProgress: (event) => {
          if (event.total) {
            setLoadingProgress((event.loaded / event.total) * 100)
          }
        },
      })
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

  /**
   * Callback for when a user is successfully deleted.
   * @param user The user that was deleted.
   */
  const onUserDeletion = (user: ClientUser) => {
    // Remove user from state.
    setUsers(users.filter(({ _id }) => _id !== user._id))
  }

  /**
   * Callback for when a file reference is successfully
   * deleted.
   * @param reference The reference that was deleted.
   */
  const onFileReferenceDeletion = (reference: ClientFileReference) => {
    // Remove user from state.
    setFileReferences(fileReferences.filter(({ _id }) => _id !== reference._id))
  }

  /* -- COMPUTED -- */

  /**
   * Config for the navigation on this page.
   */
  const navigation = compute<TNavigation_P>(() => {
    return { buttonEngine: navButtonEngine, logoLinksHome: false }
  })

  /* -- RENDER -- */

  // If the page has not yet mounted, there
  // is nothing to render yet.
  if (!mountHandled) return null

  const listsJsx = compute(() => {
    return (
      <>
        <Auth permissions={['sessions_read']}>
          <SessionList
            key={'sessions-list'}
            sessions={sessions}
            refresh={loadSessions}
          />
        </Auth>
        <Auth permissions={['missions_read']}>
          <MissionList
            key={'missions-list'}
            name={'Missions'}
            items={missions}
            onFileDrop={importMissionFiles}
            onSuccessfulCopy={onMissionCopy}
            onSuccessfulDeletion={onMissionDeletion}
          />
        </Auth>
        <Auth permissions={['users_read_students']}>
          <UserList
            key={'users-list'}
            users={users}
            onSuccessfulDeletion={onUserDeletion}
          />
        </Auth>
        <Auth permissions={['files_read']}>
          <FileReferenceList
            key={'files-list'}
            name={'Files'}
            files={[fileReferences, setFileReferences]}
            onSuccessfulDeletion={onFileReferenceDeletion}
          />
        </Auth>
      </>
    )
  })

  // Render root element.
  return (
    <div className='HomePage Page'>
      <DefaultPageLayout navigation={navigation}>{listsJsx}</DefaultPageLayout>
    </div>
  )
}
