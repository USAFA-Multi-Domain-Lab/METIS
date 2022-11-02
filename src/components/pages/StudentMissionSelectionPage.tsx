import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { getAllMissions, getMission, Mission } from '../../modules/missions'
import { Counter } from '../../modules/numbers'
import { IPageProps } from '../App'
import './StudentMissionSelectionPage.scss'

interface IStudentMissionSelectionPageProps extends IPageProps {}

const StudentMissionSelectionPage = (props: {
  pageProps: IStudentMissionSelectionPageProps
}): JSX.Element | null => {
  let pageProps: IStudentMissionSelectionPageProps = props.pageProps

  /* -- GLOBAL STATE -- */

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

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [missions, setMissions] = useState<Array<Mission>>([])

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled && pageProps.isCurrentPage) {
      let loadingMessage: string = 'Getting missions...'

      setLoadMessage(loadingMessage)

      // This loads the mission in session from the database
      // and stores it in a global state to be used on the GamePage
      // where the Mission Map renders
      getAllMissions(
        (missions: Array<Mission>) => {
          setMissions(missions)
          setLastLoadingMessage(loadingMessage)
          setLoadMessage(null)
          setMountHandled(true)
        },
        () => {
          setErrorMessage('Failed to retrieve mission.')
          setLastLoadingMessage(loadingMessage)
          setLoadMessage(null)
          setMountHandled(true)
        },
      )
    } else if (mountHandled && !pageProps.isCurrentPage) {
      setMountHandled(false)
    }
  }, [mountHandled, pageProps.isCurrentPage])

  // If active page.
  if (pageProps.show) {
    /* -- COMPONENT FUNCTIONS -- */

    // This loads the mission in session from the database
    // and stores it in a global state to be used on the GamePage
    // where the Mission Map renders
    const selectMission = (missionIDValue: string) => {
      setLoadMessage('')

      getMission(
        (selectedMission: Mission) => {
          pageProps.goToPage('GamePage', { mission: selectedMission })
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
          {missions.map((mission: Mission) => {
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
  } else {
    return null
  }
}

export default StudentMissionSelectionPage
