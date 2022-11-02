import { useState } from 'react'
import { useStore } from 'react-context-hook'
import { getMission, Mission } from '../../modules/missions'
import { Counter } from '../../modules/numbers'
import './StudentMissionSelectionPage.scss'

const StudentMissionSelectionPage = (): JSX.Element | null => {
  /* -- GLOBAL STATE -- */

  const [currentPagePath, setCurrentPagePath] =
    useStore<string>('currentPagePath')
  const [appMountHandled, setAppMountHandled] =
    useStore<boolean>('appMountHandled')
  const [loadingMessage, setLoadMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [lastLoadingMessage, setLastLoadingMessage] =
    useStore<string>('lastLoadingMessage')

  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )

  // ! Will be removed at next merge with jordan.stokes branch (11.2.2022)
  const [mission, setMission] = useStore<Mission | null>('mission')
  const [allMissions] = useStore<Array<Mission>>('allMissions')
  // ! Will be removed at next merge with jordan.stokes branch (11.2.2022)

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  // This loads the mission in session from the database
  // and stores it in a global state to be used on the DashboardPage
  // where the Mission Map renders
  const selectMission = (missionIDValue: string) => {
    getMission(
      (selectedMission: Mission) => {
        setMission(selectedMission)
        setCurrentPagePath('DashboardPage')
        setLastLoadingMessage('Initializing application...')
        setLoadMessage(null)
      },
      () => {
        setErrorMessage('Failed to retrieve mission.')
        setLoadMessage(null)
      },
      missionIDValue,
    )
  }

  /* -- RENDER -- */

  let number: Counter = new Counter(1)

  return (
    <div className='StudentMissionSelectionPage'>
      <div className='MissionList'>
        Choose your mission:
        {allMissions.map((mission: Mission) => {
          return (
            <div
              className='MissionName'
              key={mission.name}
              onClick={() => selectMission(mission.missionID)}
            >
              {' '}
              {number.count++}. {mission.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StudentMissionSelectionPage
