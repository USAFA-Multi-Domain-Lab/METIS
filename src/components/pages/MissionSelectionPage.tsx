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
import { IPageProps } from '../App'
import Branding from '../content/Branding'
import usersModule, { IUser } from '../../modules/users'
import './MissionSelectionPage.scss'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { Counter } from '../../modules/numbers'
import { Action, EActionPurpose } from '../content/Action'
import Toggle, { EToggleLockState } from '../content/Toggle'
import Tooltip from '../content/Tooltip'
import { EAjaxStatus } from '../../modules/toolbox/ajax'

interface IMissionSelectionPageProps extends IPageProps {}

const MissionSelectionPage = (props: {
  pageProps: IMissionSelectionPageProps
}): JSX.Element | null => {
  let pageProps: IMissionSelectionPageProps = props.pageProps

  /* -- GLOBAL STATE -- */

  const [loadingMessage, setLoadingMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [lastLoadingMessage, setLastLoadingMessage] =
    useStore<string>('lastLoadingMessage')

  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] = useStore<boolean>(
    'outputPanelIsDisplayed',
  )
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [
    actionSelectionPromptIsDisplayed,
    setActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('actionSelectionPromptIsDisplayed')
  const [actionDisplay, setActionDisplay] =
    useStore<Array<MissionNodeAction>>('actionDisplay')

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [missions, setMissions] = useState<Array<Mission>>([])
  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled && pageProps.isCurrentPage) {
      let loadingMessage: string = 'Getting missions...'

      setLoadingMessage(loadingMessage)

      // This loads the mission in session from the database
      // and stores it in a global state to be used on the GamePage
      // where the Mission Map renders
      getAllMissions(
        (missions: Array<Mission>) => {
          setMissions(missions)
          setLastLoadingMessage(loadingMessage)
          setLoadingMessage(null)
          setMountHandled(true)
        },
        () => {
          setErrorMessage('Failed to retrieve mission.')
          setLastLoadingMessage(loadingMessage)
          setLoadingMessage(null)
          setMountHandled(true)
        },
      )
    } else if (mountHandled && !pageProps.isCurrentPage) {
      setMountHandled(false)
      setMissions([])
      setLiveAjaxStatus(EAjaxStatus.NotLoaded)
    }
  }, [mountHandled, pageProps.isCurrentPage])

  // If active page.
  if (pageProps.show) {
    /* -- COMPONENT FUNCTIONS -- */

    // This loads the mission in session from the database
    // and stores it in a global state to be used on the GamePage
    // where the Mission Map renders
    const selectMission = (missionIDValue: string) => {
      setLoadingMessage('')

      getMission(
        (selectedMission: Mission) => {
          pageProps.goToPage('GamePage', {
            mission: selectedMission,
          })
          setLastLoadingMessage('Initializing application...')
          setLoadingMessage(null)
        },
        () => {},
        () => {
          setErrorMessage('Failed to retrieve mission.')
          setLoadingMessage(null)
        },
        missionIDValue,
      )
      setConsoleOutputs([])
      setOutputPanelIsDisplayed(false)
      setExecuteNodePathPromptIsDisplayed(false)
      setActionSelectionPromptIsDisplayed(false)
      setActionDisplay([])
    }

    // This will logout the current user.
    const logout = () => {
      setLoadingMessage('')

      usersModule.logout(
        () => {
          setLastLoadingMessage('Signing out...')
          setCurrentUser(null)
          setLoadingMessage(null)
          pageProps.goToPage('AuthPage', {
            goBackPagePath: 'MissionSelectionPage',
            goBackPageProps: {},
            postLoginPagePath: 'MissionSelectionPage',
            postLoginPageProps: {},
          })
        },
        () => {
          setLoadingMessage(null)
          setErrorMessage('Server is down. Contact system administrator.')
        },
      )
    }

    // This will switch to the edit mission
    // form.
    const login = () => {
      if (currentUser === null) {
        pageProps.goToPage('AuthPage', {
          goBackPagePath: 'MissionSelectionPage',
          goBackPageProps: {},
          postLoginPagePath: 'MissionSelectionPage',
          postLoginPageProps: {},
        })
      }
    }

    // This will start the process for
    //creating a new mission.
    const createMission = (): void => {
      pageProps.goToPage('MissionFormPage', { missionID: null })
    }

    /* -- RENDER -- */

    let number: Counter = new Counter(1)

    // Keeps track of if the user is logged in or not.
    // If the user is not logged in then the sign out button will not display.
    // If the user is logged in then the "Login" button will change to "Edit Mission"
    // and the "Sign Out" button will appear.
    let navClassName: string = 'Navigation'
    let editMissionsContainerClassName: string = 'EditMissionsContainer'
    let editMissionListClassName: string = 'MissionList'

    if (currentUser !== null) {
      navClassName += ' SignOut'
      editMissionsContainerClassName += ' show'
      editMissionListClassName += ' show'
    }

    return (
      <div className='MissionSelectionPage'>
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
                } else if (currentUser !== null) {
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
                    </div>
                    <div className='ActionsContainer'>
                      <Action
                        purpose={EActionPurpose.Edit}
                        handleClick={() => {
                          setLoadingMessage('')

                          pageProps.goToPage('MissionFormPage', {
                            missionID: mission.missionID,
                          })
                          setLastLoadingMessage('Initializing application...')
                          setLoadingMessage(null)
                        }}
                        tooltipDescription={'Edit mission'}
                      />
                      <Action
                        purpose={EActionPurpose.Remove}
                        handleClick={() => {
                          pageProps.confirm(
                            'Are you sure you want to delete this mission?',
                            () => {
                              deleteMission(
                                mission.missionID,
                                () => {
                                  // pageProps.notify(
                                  //   `Successfully deleted ${mission.name}.`,
                                  //   1000,
                                  // )
                                  setMountHandled(false)
                                },
                                () => {
                                  // pageProps.notify(
                                  //   `Failed to delete ${mission.name}.`,
                                  //   1000,
                                  // )
                                },
                              )
                            },
                          )
                        }}
                        tooltipDescription={'Remove mission'}
                      />
                      <Action
                        purpose={EActionPurpose.Copy}
                        handleClick={() => {
                          pageProps.confirm(
                            'Enter the name of the new mission.',
                            (entry?: string) => {
                              if (entry !== undefined) {
                                copyMission(
                                  mission.missionID,
                                  entry,
                                  () => {
                                    // pageProps.notify(
                                    //   `Successfully copied ${mission.name}.`,
                                    //   1000,
                                    // )
                                    setMountHandled(false)
                                  },
                                  () => {
                                    // pageProps.notify(
                                    //   `Failed to copy ${mission.name}.`,
                                    //   1000,
                                    // )
                                  },
                                )
                              }
                            },
                            {
                              requireEntry: true,
                              entryLabel: 'Name',
                            },
                          )
                        }}
                        tooltipDescription={'Copy mission'}
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
                                  // pageProps.notify(
                                  //   `${mission.name} was successfully turned on.`,
                                  //   3000,
                                  // )
                                  setLiveAjaxStatus(EAjaxStatus.Loaded)
                                } else {
                                  // pageProps.notify(
                                  //   `${mission.name} was successfully turned off.`,
                                  //   3000,
                                  // )
                                  setLiveAjaxStatus(EAjaxStatus.Loaded)
                                }
                              },
                              () => {
                                if (live) {
                                  // pageProps.notify(
                                  //   `${mission.name} failed to turn on.`,
                                  //   3000,
                                  // )
                                  setLiveAjaxStatus(EAjaxStatus.Error)
                                } else {
                                  // pageProps.notify(
                                  //   `${mission.name} failed to turn off.`,
                                  //   3000,
                                  // )
                                  setLiveAjaxStatus(EAjaxStatus.Error)
                                }
                              },
                            )
                            setLiveAjaxStatus(EAjaxStatus.Loading)
                          }}
                        />
                        <Tooltip description='This will allow students the ability to access this mission or not.' />
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
  } else {
    return null
  }
}

export default MissionSelectionPage
