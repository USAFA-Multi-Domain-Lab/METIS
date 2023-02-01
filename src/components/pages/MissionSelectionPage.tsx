import { useEffect, useRef, useState } from 'react'
import {
  copyMission,
  deleteMission,
  getAllMissions,
  importMissions,
  Mission,
  setLive,
} from '../../modules/missions'
import { IPage } from '../App'
import './MissionSelectionPage.scss'
import { Counter } from '../../modules/numbers'
import { ButtonSVG, EButtonSVGPurpose } from '../content/react/ButtonSVG'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/react/Navigation'
import MissionSelectionRow from '../content/react/MissionSelectionRow'
import { ButtonText } from '../content/react/ButtonText'
import Notification from '../../modules/notifications'

export interface IMissionSelectionPage extends IPage {}

export default function MissionSelectionPage(
  props: IMissionSelectionPage,
): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [missions, setMissions] = useState<Array<Mission>>([])
  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      const handleLoadCompletion = () => setMountHandled(true)

      loadMissions(handleLoadCompletion, handleLoadCompletion)
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  // This loads the missions displayed in the
  // list of missions for selection.
  const loadMissions = (
    callback: () => void = () => {},
    callbackError: (error: Error) => void = () => {},
  ) => {
    appActions.beginLoading('Retrieving missions...')

    // This loads the mission in session from the database
    // and stores it in a global state to be used on the GamePage
    // where the Mission Map renders
    getAllMissions(
      (missions: Array<Mission>) => {
        setMissions(missions)
        appActions.finishLoading()
        callback()
      },
      (error: Error) => {
        appActions.handleServerError('Failed to retrieve mission.')
        appActions.finishLoading()
        callbackError(error)
      },
    )
  }

  // This loads the mission in session from the database
  // and stores it in a global state to be used on the GamePage
  // where the Mission Map renders
  const selectMission = (missionID: string) =>
    appActions.goToPage('GamePage', {
      missionID,
    })

  // This will logout the current user.
  const logout = () =>
    appActions.logout({
      returningPagePath: 'MissionSelectionPage',
      returningPageProps: {},
    })

  // This will switch to the auth page.
  const login = () =>
    appActions.goToPage('AuthPage', {
      returningPagePath: 'MissionSelectionPage',
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
            `${invalidFileExtensionCount} of the files uploaded did not have the .cesar extension and therefore ${
              invalidFileExtensionCount === 1 ? 'was' : 'were'
            } rejected.`,
          )
        }
      }

      // Reloads missions now that all files
      // have been processed.
      loadMissions(loadMissionsCallback, loadMissionsCallback)
    }

    // Switch to load screen.
    appActions.beginLoading(
      `Importing ${files.length} file${files.length === 1 ? '' : 's'}...`,
    )

    // Iterates over files for upload.
    for (let file of files) {
      // If a .cesar file, import it.
      if (file.name.endsWith('.cesar')) {
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

  // This is called when a user requests
  // to edit the mission.
  const handleEditRequest = (mission: Mission) => {
    appActions.goToPage('MissionFormPage', {
      missionID: mission.missionID,
    })
  }

  // This is called when a user requests
  // to delete the mission.
  const handleDeleteRequest = (mission: Mission) => {
    appActions.confirm(
      'Are you sure you want to delete this mission?',
      (concludeAction: () => void) => {
        concludeAction()
        appActions.beginLoading('Deleting mission...')

        deleteMission(
          mission.missionID,
          () => {
            appActions.finishLoading()
            appActions.notify(`Successfully deleted ${mission.name}.`)
            setMountHandled(false)
          },
          () => {
            appActions.finishLoading()
            appActions.notify(`Failed to delete ${mission.name}.`)
          },
        )
      },
      {
        pendingMessageUponConfirm: 'Deleting...',
      },
    )
  }

  // This is called when a user requests
  // to copy the mission.
  const handleCopyRequest = (mission: Mission) => {
    appActions.confirm(
      'Enter the name of the new mission.',
      (concludeAction: () => void, entry: string) => {
        concludeAction()
        appActions.beginLoading('Copying mission...')

        copyMission(
          mission.missionID,
          entry,
          () => {
            appActions.finishLoading()
            appActions.notify(`Successfully copied ${mission.name}.`)
            setMountHandled(false)
          },
          () => {
            appActions.finishLoading()
            appActions.notify(`Failed to copy ${mission.name}.`)
          },
        )
      },
      {
        requireEntry: true,
        entryLabel: 'Name',
        buttonConfirmText: 'Copy',
        pendingMessageUponConfirm: 'Copying...',
      },
    )
  }

  // This is called when a user requests
  // to toggle a mission between being live
  // and not being live.
  const handleToggleLiveRequest = (mission: Mission, live: boolean) => {
    let previousLiveState: boolean = mission.live

    mission.live = live

    setLive(
      mission.missionID,
      live,
      () => {
        if (live) {
          appActions.notify(`${mission.name} was successfully turned on.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
        } else {
          appActions.notify(`${mission.name} was successfully turned off.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
        }
      },
      () => {
        if (live) {
          appActions.notify(`${mission.name} failed to turn on.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        } else {
          appActions.notify(`${mission.name} failed to turn off.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        }
        mission.live = previousLiveState
      },
    )
    setLiveAjaxStatus(EAjaxStatus.Loading)
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

  // This is a file is dropped onto the page.
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    let page_elm: HTMLDivElement | null = page.current

    if (page_elm !== null) {
      let files: FileList = event.dataTransfer.files

      page_elm.classList.remove('DropPending')

      if (files.length > 0) {
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

  // This will start the process for
  //creating a new mission.
  const createMission = (): void =>
    appActions.goToPage('MissionFormPage', { missionID: null })

  /* -- RENDER -- */

  let number: Counter = new Counter(1)

  // Keeps track of if the user is logged in or not.
  let editMissionsContainerClassName: string = 'EditMissionsContainer'
  let editMissionListClassName: string = 'MissionList'
  let displayLogin: boolean = true
  let displayLogout: boolean = false

  let noMissionsClassName: string = 'NoMissions'

  if (appState.currentUser !== null) {
    editMissionsContainerClassName += ' InstructorView'
    editMissionListClassName += ' InstructorView'
    displayLogin = false
    displayLogout = true
  }

  if (missions.length > 0) {
    noMissionsClassName += ' hidden'
  }

  // This will iterate over the missions,
  // and render all the rows for the list.
  const renderMissionSelectionRows = (): JSX.Element[] => {
    let missionSelectionRows: JSX.Element[] = missions.map(
      (mission: Mission) => (
        <MissionSelectionRow
          mission={mission}
          liveAjaxStatus={liveAjaxStatus}
          handleSelectionRequest={() => selectMission(mission.missionID)}
          handleEditRequest={() => handleEditRequest(mission)}
          handleDeleteRequest={() => handleDeleteRequest(mission)}
          handleCopyRequest={() => handleCopyRequest(mission)}
          handleToggleLiveRequest={(live: boolean) =>
            handleToggleLiveRequest(mission, live)
          }
          key={`MissionSelectionRow_${mission.missionID}`}
        />
      ),
    )

    return missionSelectionRows
  }

  return (
    <div
      className='MissionSelectionPage Page'
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* { File Drop Box } */}
      <div className={'FileDropBox'}>
        <div className='UploadIcon'></div>
      </div>
      {/* { Navigation } */}
      <Navigation
        brandingCallback={null}
        brandingTooltipDescription={null}
        links={[
          { text: 'Login', handleClick: login, visible: displayLogin },
          { text: 'Log out', handleClick: logout, visible: displayLogout },
        ]}
      />
      {/* { Content } */}
      <div className='MissionSelectionContent'>
        <div className='MissionListContainer'>
          <div className={editMissionListClassName}>
            <div className='HeadingContainer'>
              <div className='Heading'>Select your mission:</div>
            </div>
            <div className='MissionSelectionRows'>
              {renderMissionSelectionRows()}
            </div>
            <div className={noMissionsClassName}>No missions available...</div>
          </div>
        </div>
        <div className={editMissionsContainerClassName}>
          <ButtonSVG
            purpose={EButtonSVGPurpose.Add}
            handleClick={createMission}
            tooltipDescription={'Create new mission'}
            uniqueClassName={'NewMissionButton'}
          />
          <ButtonSVG
            purpose={EButtonSVGPurpose.Upload}
            handleClick={handleMissionImportRequest}
            tooltipDescription={'Import a .cesar file from your local system.'}
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

      <div className='credit'>Photo by Adi Goldstein on Unsplash</div>
    </div>
  )
}
