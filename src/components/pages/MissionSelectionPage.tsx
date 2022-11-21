import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  copyMission,
  deleteMission,
  getAllMissions,
  getMission,
  Mission,
  setLive,
} from '../../modules/missions'
import { IPage } from '../App'
import Branding from '../content/Branding'
import './MissionSelectionPage.scss'
import { Counter } from '../../modules/numbers'
import { Action, EActionPurpose } from '../content/Action'
import Toggle, { EToggleLockState } from '../content/Toggle'
import Tooltip from '../content/Tooltip'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import AppState, { AppActions } from '../AppState'

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

  // This will start the process for
  //creating a new mission.
  const createMission = (): void =>
    appActions.goToPage('MissionFormPage', { missionID: null })

  /* -- RENDER -- */

  let number: Counter = new Counter(1)

  // Keeps track of if the user is logged in or not.
  // If the user is not logged in then the sign out button will not display.
  // If the user is logged in then the "Login" button will change to "Edit Mission"
  // and the "Sign Out" button will appear.
  let navClassName: string = 'Navigation'
  let editMissionsContainerClassName: string = 'EditMissionsContainer'
  let editMissionListClassName: string = 'MissionList'

  if (appState.currentUser !== null) {
    navClassName += ' SignOut'
    editMissionsContainerClassName += ' show'
    editMissionListClassName += ' show'
  }

  return (
    <div className='MissionSelectionPage Page'>
      {/* { Navigation } */}
      <div className={navClassName}>
        <Branding
          goHome={() => null}
          tooltipDescription=''
          showTooltip={false}
        />
        <div className='Login Link' onClick={login}>
          Login
        </div>
        <div className='Logout Link' onClick={logout}>
          Sign out
        </div>
      </div>
      {/* { Content } */}
      <div className='MissionSelectionContent'>
        <div className='MissionListContainer'>
          <div className={editMissionListClassName}>
            <div className='HeadingContainer'>
              <div className='Heading'>Select your mission:</div>
            </div>
            {missions.map((mission: Mission) => {
              // Logic for missions to appear/disappear for students
              // based on what the instructor sets the individual
              // mission to.
              let individualMissionContainerClassName: string =
                'IndividualMissionContainer'
              if (mission.live) {
                individualMissionContainerClassName += ' show'
              } else if (appState.currentUser !== null) {
                individualMissionContainerClassName += ' show'
              } else {
                individualMissionContainerClassName =
                  'IndividualMissionContainer'
              }

              // Logic that will lock the mission toggle while a request is being sent
              // to set the mission.live paramter
              let lockLiveToggle: EToggleLockState = EToggleLockState.Unlocked
              if (liveAjaxStatus === EAjaxStatus.Loading && mission.live) {
                lockLiveToggle = EToggleLockState.LockedActivation
              } else if (
                liveAjaxStatus === EAjaxStatus.Loading &&
                !mission.live
              ) {
                lockLiveToggle = EToggleLockState.LockedDeactivation
              } else {
                lockLiveToggle = EToggleLockState.Unlocked
              }

              return (
                <div
                  className={individualMissionContainerClassName}
                  key={mission.missionID}
                >
                  <div
                    className='MissionName'
                    onClick={() => selectMission(mission.missionID)}
                  >
                    {number.count++}. {mission.name}
                    <Tooltip description={'Launch mission.'} />
                  </div>
                  <div className='ActionsContainer'>
                    <Action
                      purpose={EActionPurpose.Edit}
                      handleClick={() => {
                        appActions.goToPage('MissionFormPage', {
                          missionID: mission.missionID,
                        })
                      }}
                      tooltipDescription={'Edit mission.'}
                    />
                    <Action
                      purpose={EActionPurpose.Remove}
                      handleClick={() => {
                        appActions.confirm(
                          'Are you sure you want to delete this mission?',
                          (concludeAction: () => void) => {
                            concludeAction()
                            appActions.beginLoading('Deleting mission...')

                            deleteMission(
                              mission.missionID,
                              () => {
                                appActions.notify(
                                  `Successfully deleted ${mission.name}.`,
                                )
                                setMountHandled(false)
                              },
                              () => {
                                appActions.notify(
                                  `Failed to delete ${mission.name}.`,
                                )
                              },
                            )
                          },
                          {
                            pendingMessageUponConfirm: 'Deleting...',
                          },
                        )
                      }}
                      tooltipDescription={'Remove mission.'}
                    />
                    <Action
                      purpose={EActionPurpose.Copy}
                      handleClick={() => {
                        appActions.confirm(
                          'Enter the name of the new mission.',
                          (concludeAction: () => void, entry: string) => {
                            concludeAction()
                            appActions.beginLoading('Copying mission...')

                            copyMission(
                              mission.missionID,
                              entry,
                              () => {
                                appActions.notify(
                                  `Successfully copied ${mission.name}.`,
                                )
                                setMountHandled(false)
                              },
                              () => {
                                appActions.notify(
                                  `Failed to copy ${mission.name}.`,
                                )
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
                      }}
                      tooltipDescription={'Copy mission.'}
                    />
                    <div className='ToggleContainer'>
                      <Toggle
                        initiallyActivated={mission.live}
                        lockState={lockLiveToggle}
                        deliverValue={(live: boolean) => {
                          mission.live = live

                          setLive(
                            mission.missionID,
                            live,
                            () => {
                              if (live) {
                                appActions.notify(
                                  `${mission.name} was successfully turned on.`,
                                )
                                setLiveAjaxStatus(EAjaxStatus.Loaded)
                              } else {
                                appActions.notify(
                                  `${mission.name} was successfully turned off.`,
                                )
                                setLiveAjaxStatus(EAjaxStatus.Loaded)
                              }
                            },
                            () => {
                              if (live) {
                                appActions.notify(
                                  `${mission.name} failed to turn on.`,
                                )
                                setLiveAjaxStatus(EAjaxStatus.Error)
                              } else {
                                appActions.notify(
                                  `${mission.name} failed to turn off.`,
                                )
                                setLiveAjaxStatus(EAjaxStatus.Error)
                              }
                            },
                          )
                          setLiveAjaxStatus(EAjaxStatus.Loading)
                        }}
                      />
                      <Tooltip
                        description={
                          !mission.live
                            ? 'Set mission as live. Allowing students to access it.'
                            : 'Set mission as no longer live. Preventing students from accessing it.'
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={editMissionsContainerClassName}>
          <Action
            purpose={EActionPurpose.Add}
            handleClick={createMission}
            tooltipDescription={'Create new mission'}
            uniqueClassName={'NewMissionButton'}
          />
        </div>
      </div>

      <div className='credit'>Photo by Adi Goldstein on Unsplash</div>
    </div>
  )
}
