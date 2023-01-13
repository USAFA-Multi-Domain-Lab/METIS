import { useEffect, useState } from 'react'
import {
  copyMission,
  deleteMission,
  getAllMissions,
  Mission,
  setLive,
} from '../../modules/missions'
import { IPage } from '../App'
import './MissionSelectionPage.scss'
import { Counter } from '../../modules/numbers'
import { ButtonSVG, EButtonSVGPurpose } from '../content/ButtonSVG'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/Navigation'
import MissionSelectionRow from '../content/MissionSelectionRow'

export interface IMissionSelectionPage extends IPage {}

export default function MissionSelectionPage(
  props: IMissionSelectionPage,
): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

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
      appActions.beginLoading('Retrieving missions...')

      // This loads the mission in session from the database
      // and stores it in a global state to be used on the GamePage
      // where the Mission Map renders
      getAllMissions(
        (missions: Array<Mission>) => {
          setMissions(missions)
          appActions.finishLoading()
          setMountHandled(true)
        },
        () => {
          appActions.handleServerError('Failed to retrieve mission.')
          appActions.finishLoading()
          setMountHandled(true)
        },
      )
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

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

  // This will start the process for
  //creating a new mission.
  const createMission = (): void =>
    appActions.goToPage('MissionFormPage', { missionID: null })

  // This will prompt the user to import
  // a mission from their system.
  const importMission = (): void => {}

  /* -- RENDER -- */

  let number: Counter = new Counter(1)

  // Keeps track of if the user is logged in or not.
  let editMissionsContainerClassName: string = 'EditMissionsContainer'
  let editMissionListClassName: string = 'MissionList'
  let displayLogin: boolean = true
  let displayLogout: boolean = false

  let noMissionsClassName: string = 'NoMissions'

  if (appState.currentUser !== null) {
    editMissionsContainerClassName += ' show'
    editMissionListClassName += ' show'
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
    <div className='MissionSelectionPage Page'>
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
            handleClick={importMission}
            tooltipDescription={'Import a .cesar file from your local system.'}
          />
        </div>
      </div>

      <div className='credit'>Photo by Adi Goldstein on Unsplash</div>
    </div>
  )
}
