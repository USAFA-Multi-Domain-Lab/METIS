import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientFileReference from 'src/files/references'
import ClientMission from 'src/missions'
import Notification from 'src/notifications'
import SessionClient from 'src/sessions'
import { SessionBasic } from 'src/sessions/basic'
import { compute } from 'src/toolbox'
import {
  useMountHandler,
  useRequireLogin,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { DefaultLayout } from '.'
import Prompt from '../content/communication/Prompt'
import FileReferenceList from '../content/data/lists/implementations/FileReferenceList'
import MissionList from '../content/data/lists/implementations/MissionList'
import SessionList from '../content/data/lists/implementations/SessionList'
import UserList from '../content/data/lists/implementations/UserList'
import { LogoutLink } from '../content/general-layout/Navigation'
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
  const { beginLoading, finishLoading, handleError, notify, prompt } =
    globalContext.actions

  /* -- REFS -- */
  const page = useRef<HTMLDivElement>(null)

  /* -- STATE -- */
  const [sessions, setSessions] = useState<SessionBasic[]>([])
  const [missions, setMissions] = useState<ClientMission[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])
  const [files, setFiles] = useState<ClientFileReference[]>([])

  /* -- LOGIN-SPECIFIC LOGIC -- */

  // Require login for page.
  const { login } = useRequireLogin()

  // Grab the user currently logged in.
  let { user: currentUser } = login

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler(async (done) => {
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

      // The user currently logged in must
      // have restricted access to view the
      // files.
      // todo: Add proper authorization logic.
      if (true) {
        await loadFiles()
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
   * This loads the files into the state for display and selection.
   */
  const loadFiles = (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Begin loading.
        beginLoading('Retrieving files...')
        // Fetch files from API and store
        // them in the state.
        setFiles(await ClientFileReference.$fetchAll())
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
          notify(
            `${invalidFileExtensionCount} of the files uploaded did not have the .metis extension and therefore ${
              invalidFileExtensionCount === 1 ? 'was' : 'were'
            } rejected.`,
          )
        }
      }

      // todo: Resolve this comment.
      // Reloads missions now that all files
      // have been processed.
      // loadMissions().then(loadMissionsCallback).catch(loadMissionsCallback)
      loadFiles()
    }

    // Switch to load screen.
    beginLoading(
      `Importing ${files.length} file${files.length === 1 ? '' : 's'}...`,
    )

    validFiles = Array.from(files)

    // Iterates over files for upload.
    // todo: Resolve this comment.
    // for (let file of files) {
    //   if (file.name.toLowerCase().endsWith('.cesar')) {
    //     // If a .cesar file, import it.
    //     validFiles.push(file)
    //   }
    //   // If a .metis file, import it.
    //   else if (file.name.toLowerCase().endsWith('.metis')) {
    //     validFiles.push(file)
    //   }
    //   // Else, don't.
    //   else {
    //     invalidFileExtensionCount++
    //   }
    // }

    // Import the files.
    try {
      let files = await ClientFileReference.$upload(validFiles)
      successfulImportCount += files.length
      // todo: Resolve this comment.
      // let response = await ClientMission.$import(validFiles)
      // successfulImportCount += response.successfulImportCount
      // invalidContentsCount += response.failedImportCount
      // invalidContentsErrorMessages = response.failedImportErrorMessages
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

  const listsJsx = compute(() => {
    let results: JSX.Element[] = []

    // If the user is authorized to read sessions,
    // then display the sessions list.
    if (currentUser.isAuthorized('sessions_read')) {
      results.push(
        <SessionList
          key={'sessions-list'}
          sessions={sessions}
          refresh={loadSessions}
        />,
      )
    }

    // If the user is authorized to read missions,
    // then display the missions list.
    if (currentUser.isAuthorized('missions_read')) {
      results.push(
        <MissionList
          key={'missions-list'}
          missions={missions}
          onSuccessfulCopy={onMissionCopy}
          onSuccessfulDeletion={onMissionDeletion}
          importMissionFiles={importMissionFiles}
        />,
      )
    }

    // If the user is authorized to read and write,
    // at the very least, students, then display the
    // users list.
    if (
      currentUser.isAuthorized(['users_read_students', 'users_write_students'])
    ) {
      results.push(
        <UserList
          key={'users-list'}
          users={users}
          onSuccessfulDeletion={onUserDeletion}
        />,
      )
    }

    // If the user is authorized to read and write files,
    // then display the files list.
    // todo: Add proper authorization logic.
    if (true) {
      results.push(<FileReferenceList key={'files-list'} files={files} />)
    }

    return results
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
      <DefaultLayout navigation={navigation}>{listsJsx}</DefaultLayout>
    </div>
  )
}
