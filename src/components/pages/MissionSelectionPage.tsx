import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getAllMissions, importMissions, Mission } from '../../modules/missions'
import { IPage } from '../App'
import './MissionSelectionPage.scss'
import {
  ButtonSVG,
  EButtonSVGPurpose,
} from '../content/user-controls/ButtonSVG'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import MissionSelectionRow from '../content/user-controls/MissionSelectionRow'
import Notification from '../../modules/notifications'
import Tooltip from '../content/communication/Tooltip'
import { permittedRoles } from '../../modules/users'
import { useMountHandler } from '../../modules/hooks'
import { GameClient } from 'src/modules/games'

export interface IMissionSelectionPage extends IPage {}

export default function MissionSelectionPage(
  props: IMissionSelectionPage,
): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT REFS -- */

  const page = useRef<HTMLDivElement>(null)
  const importMissionTrigger = useRef<HTMLInputElement>(null)
  const inputFocusRef = useRef<HTMLInputElement>(null)

  /* -- COMPONENT STATE -- */

  const [missions, setMissions] = useState<Array<Mission>>([])
  const [displayedMissions, setDisplayedMissions] = useState<Array<Mission>>([])
  const [allMissionsFromSearch, setAllMissionsFromSearch] = useState<
    Array<Mission>
  >([])
  const [currentMissionSet, setCurrentMissionSet] = useState<number>(1)
  const [displaySearchBar, setDisplaySearchBar] = useState<boolean>(false)
  const [resetMissionList, setResetMissionList] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')

  /* -- COMPONENT EFFECTS -- */

  const [mountHandled, remount] = useMountHandler((done) =>
    loadMissions(done, done),
  )

  // This will reset the mission list to what
  // it was when the page loaded initially.
  useEffect(() => {
    if (resetMissionList) {
      setCurrentMissionSet(1)
      let displayedMissions: Array<Mission> = []

      missions.forEach((mission: Mission, index: number) => {
        if (index < numberOfMissionsShown) {
          displayedMissions.push(mission)
        }
      })

      setDisplayedMissions(displayedMissions)
      setResetMissionList(false)
    }
  }, [!resetMissionList])

  // This automatically focuses the search bar
  // input element.
  useEffect(() => {
    if (displaySearchBar) {
      const inputElement: HTMLInputElement | null = inputFocusRef.current
      if (inputElement !== null) {
        inputElement.focus()
      }
    }
  }, [!displaySearchBar])

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
        setResetMissionList(true)
        appActions.finishLoading()
        callback()
      },
      (error: Error) => {
        appActions.handleError('Failed to retrieve mission.')
        appActions.finishLoading()
        callbackError(error)
      },
    )
  }

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
      loadMissions(loadMissionsCallback, loadMissionsCallback)
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

      if (
        files.length > 0 &&
        permittedRoles.includes(appState.session?.user.role ?? 'NOT_LOGGED_IN')
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

  // This will start the process for
  //creating a new mission.
  const createMission = (): void =>
    appActions.goToPage('MissionFormPage', { missionID: null })

  // This will switch to the changelog
  // page.
  const viewChangelog = (): void => {
    if (
      permittedRoles.includes(appState.session?.user.role ?? 'NOT_LOGGED_IN')
    ) {
      appActions.goToPage('ChangelogPage', {})
    }
  }

  // Toggles through the pages of missions.
  const showPreviousMissionSet = () => {
    let previousDisplayOfMissions: Array<Mission> = []

    if (currentMissionSet !== 1) {
      setCurrentMissionSet(currentMissionSet - 1)

      // Sets the range of missions that will be displayed.
      let missionRangeStart: number =
        (currentMissionSet - 2) * numberOfMissionsShown // Subtract 2 here because arrays start at index 0 and currentMissionSet starts at 1 for displaying purposes.
      let missionRangeStop: number =
        (currentMissionSet - 1) * numberOfMissionsShown

      if (searchText !== '') {
        // Loops through all the missions from the search
        // that the user has done and selects which missions
        // to display based on the created range.
        allMissionsFromSearch.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            previousDisplayOfMissions.push(mission)
          }
        })
      } else {
        // Loops through all the missions and selects which
        // missions to display based on the created range.
        missions.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            previousDisplayOfMissions.push(mission)
          }
        })
      }

      // Updates the missions that are currently being
      // displayed.
      setDisplayedMissions(previousDisplayOfMissions)
    } else {
      setCurrentMissionSet(totalMissionSets)

      // Sets the initial range of missions that will
      // be displayed.
      let previousMissionSet: number = totalMissionSets - 1
      let missionRangeStart: number = previousMissionSet * numberOfMissionsShown
      let missionRangeStop: number = totalMissionSets * numberOfMissionsShown

      if (searchText !== '') {
        // Loops through all the missions from the search
        // that the user has done and selects which missions
        // to display based on the created range.
        allMissionsFromSearch.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            previousDisplayOfMissions.push(mission)
          }
        })
      } else {
        // Loops through all the missions and selects which
        // missions to display based on the created range.
        missions.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            previousDisplayOfMissions.push(mission)
          }
        })
      }

      // Updates the missions that are currently being
      // displayed.
      setDisplayedMissions(previousDisplayOfMissions)
    }
  }

  // Toggles through the pages of missions.
  const showNextMissionSet = () => {
    let nextDisplayOfMissions: Array<Mission> = []

    if (currentMissionSet !== totalMissionSets) {
      setCurrentMissionSet(currentMissionSet + 1)

      // Sets the range of missions that will be displayed.
      let missionRangeStart: number = currentMissionSet * numberOfMissionsShown
      let nextMissionSet: number = currentMissionSet + 1
      let missionRangeStop: number = nextMissionSet * numberOfMissionsShown

      if (searchText !== '') {
        // Loops through all the missions from the search
        // that the user has done and selects which missions
        // to display based on the created range.
        allMissionsFromSearch.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            nextDisplayOfMissions.push(mission)
          }
        })
      } else {
        // Loops through all the missions and selects which
        // missions to display based on the created range.
        missions.forEach((mission: Mission, index: number) => {
          if (index >= missionRangeStart && index < missionRangeStop) {
            nextDisplayOfMissions.push(mission)
          }
        })
      }
      // Updates the missions that are currently being
      // displayed.
      setDisplayedMissions(nextDisplayOfMissions)
    } else {
      setCurrentMissionSet(1)

      if (searchText !== '') {
        // Loops through all the missions from the search
        // that the user has done and selects which missions
        // to display based on the created range.
        allMissionsFromSearch.forEach((mission: Mission, index: number) => {
          if (index < numberOfMissionsShown) {
            nextDisplayOfMissions.push(mission)
          }
        })
      } else {
        // Brings the user back to the "first page" of missions.
        missions.forEach((mission: Mission, index: number) => {
          if (index < numberOfMissionsShown) {
            nextDisplayOfMissions.push(mission)
          }
        })
      }

      // Updates the missions that are currently being
      // displayed.
      setDisplayedMissions(nextDisplayOfMissions)
    }
  }

  // Toggles the search bar.
  const toggleMissionSearch = () => {
    if (displaySearchBar) {
      // Resets the mission list display
      // when the search bar is toggled off.
      setSearchText('')
      setDisplayedMissions([])
      setCurrentMissionSet(1)
      setResetMissionList(true)

      setDisplaySearchBar(false)
    } else {
      setDisplaySearchBar(true)
    }
  }

  // Searches for missions and displays missions
  // based on what the user types.
  const onSearch = (e: React.FormEvent<HTMLInputElement>) => {
    let currentText: string = e.currentTarget.value
    let newSearchText: string = currentText.toLowerCase()
    let allMissionsFromSearch: Array<Mission> = []
    let displayedSearchMissions: Array<Mission> = []

    missions.forEach((mission: Mission) => {
      if (newSearchText) {
        let missionName: string = mission.name.toLowerCase()
        let missionNameMatch: boolean = missionName.includes(newSearchText)

        if (missionNameMatch) {
          allMissionsFromSearch.push(mission)
        }
      } else {
        setResetMissionList(true)
      }
    })

    // Shows the user what they have typed.
    setSearchText(currentText)

    // Changes the current page number to 1.
    setCurrentMissionSet(1)

    // Sets and shows the first range, or page,
    // of missions based on the user's input.
    setAllMissionsFromSearch(allMissionsFromSearch)
    allMissionsFromSearch.forEach((mission: Mission, index: number) => {
      if (index < numberOfMissionsShown) {
        displayedSearchMissions.push(mission)
      }
    })
    setDisplayedMissions(displayedSearchMissions)
  }

  /**
   * Callback for when a mission is selected.
   */
  const handleMissionSelection = useCallback(
    async (mission: Mission) => {
      let { server } = appState

      if (server !== null) {
        try {
          // Notify user of mission launch.
          appActions.beginLoading('Launching mission...')
          // Launch game from mission ID, awaiting
          // the promised game ID.
          let gameID: string = await GameClient.launch(mission.missionID)
          // Notify user of mission join.
          appActions.beginLoading('Joining mission...')
          // Join game from new game ID, awaiting
          // the promised game client.
          let game: GameClient = await GameClient.join(gameID, server)
          // Go to the game page with the new
          // game client.
          appActions.goToPage('GamePage', { game })
        } catch (error) {
          appActions.handleError({
            message: 'Failed to launch mission. Contact system administrator.',
            notifyMethod: 'page',
          })
        }
      } else {
        appActions.handleError({
          message: 'No server connection. Contact system administrator',
          notifyMethod: 'bubble',
        })
      }
    },
    [appActions, appState.server],
  )

  /* -- PRE-RENDER PROCESSING -- */

  // Keeps track of if the user is logged in or not.
  let editMissionsContainerClassName: string = 'EditMissionsContainer'
  let editMissionListClassName: string = 'MissionList'
  let missionNavPanelClassName: string = 'MissionNavPanel'
  let searchContainerClassName: string = 'Hidden'
  let fileDropBoxClassName: string = 'Hidden'
  let displayLogin: boolean = appState.session === null
  let displayLogout: boolean = !displayLogin

  let noMissionsClassName: string = 'NoMissions'
  let versionClassName: string = 'Version Disabled'

  // Variables used for mission pagination
  let numberOfMissionsShown: number = 5
  let totalMissionSets: number = 1

  if (permittedRoles.includes(appState.session?.user.role ?? 'NOT_LOGGED_IN')) {
    editMissionsContainerClassName += ' InstructorView'
    editMissionListClassName += ' InstructorView'
    missionNavPanelClassName += ' InstructorView'
    fileDropBoxClassName = 'FileDropBox'
  }

  if (displayedMissions.length > 0) {
    noMissionsClassName += ' Hidden'
    totalMissionSets = Math.ceil(missions.length / numberOfMissionsShown)
  }

  if (displaySearchBar) {
    searchContainerClassName = 'SearchContainer'
    numberOfMissionsShown = numberOfMissionsShown - 1
  }

  // Changes the total number of pages based on what
  // the user types in the search bar.
  if (searchText !== '' && allMissionsFromSearch.length > 0) {
    totalMissionSets = Math.ceil(
      allMissionsFromSearch.length / numberOfMissionsShown,
    )
  }

  if (permittedRoles.includes(appState.session?.user.role ?? 'NOT_LOGGED_IN')) {
    versionClassName = 'Version'
  }

  const manuallyJoin = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    let target: HTMLFormElement = event.target as HTMLFormElement

    let gameIDElement: HTMLInputElement | null =
      target.querySelector('.game-id')
    console.log(target)

    if (gameIDElement && appState.server) {
      let gameID: string = gameIDElement.value

      console.log(gameID)
      let game: GameClient = await GameClient.join(gameID, appState.server)

      console.log(game)
      appActions.goToPage('GamePage', { game })
    }
  }, [])

  /* -- INTERNAL COMPONENTS -- */

  // Renders out missions for the list.
  const MissionSelectionRows = useCallback((): JSX.Element | null => {
    let missionSelectionRows: JSX.Element[] = displayedMissions.map(
      (mission: Mission) => (
        <MissionSelectionRow
          mission={mission}
          handleSelection={() => handleMissionSelection(mission)}
          appActions={appActions}
          remountPage={remount}
          key={`MissionSelectionRow_${mission.missionID}`}
        />
      ),
    )

    return <div className='MissionSelectionRows'>{missionSelectionRows}</div>
  }, [displayedMissions, handleMissionSelection, appActions, remount])

  /* -- RENDER -- */

  return (
    <div
      className='MissionSelectionPage Page'
      ref={page}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* { File Drop Box } */}
      <div className={fileDropBoxClassName}>
        <div className='UploadIcon'></div>
      </div>
      {/* { Navigation } */}
      <Navigation
        brandingCallback={null}
        brandingTooltipDescription={null}
        links={[
          {
            text: 'Login',
            handleClick: login,
            visible: displayLogin,
            key: 'login',
          },
          {
            text: 'Log out',
            handleClick: logout,
            visible: displayLogout,
            key: 'log-out',
          },
        ]}
      />
      {/* { Content } */}
      <div className='MissionSelectionContent'>
        <div className='MissionListContainer'>
          <div className={editMissionListClassName}>
            <div className='HeadingContainer'>
              <div className='Heading'>Select your mission:</div>
              <ButtonSVG
                purpose={EButtonSVGPurpose.Search}
                handleClick={toggleMissionSearch}
                tooltipDescription={'Search for a specific mission.'}
              />
            </div>
            <div className={searchContainerClassName}>
              <input
                placeholder='Type here to search...'
                className='SearchBar'
                value={searchText}
                onChange={onSearch}
                ref={inputFocusRef}
              />
            </div>
            <MissionSelectionRows />
            <div className={noMissionsClassName}>No missions available...</div>
          </div>
          <div className={missionNavPanelClassName}>
            <div className='PreviousMissionSetButton'>
              <span className='Text' onClick={showPreviousMissionSet}>
                Previous
              </span>
            </div>
            <div className='CurrentMissionSet'>
              {currentMissionSet} / {totalMissionSets}
            </div>
            <div className='NextMissionSetButton'>
              <span className='Text' onClick={showNextMissionSet}>
                Next
              </span>
            </div>
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

      <div className='ManualJoin'>
        <form onSubmit={manuallyJoin}>
          <input className='game-id' type='text' name='gameID' />
          <input type='submit' value='Join' />
        </form>
      </div>

      <div className='FooterContainer' draggable={false}>
        <div className='Version' onClick={viewChangelog} draggable={false}>
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
