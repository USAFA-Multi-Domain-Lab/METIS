import ClientMission from 'src/missions'
import { useState } from 'react'
import { EAjaxStatus } from '../../../../../shared/toolbox/ajax'
import { Detail, DetailBox, DetailNumber, DetailToggle } from '../form/Form'
import './MissionEntry.scss'
import { useGlobalContext } from 'src/context'

// This will render the basic editable
// details of the mission itself.
export default function MissionEntry(props: {
  active: boolean
  mission: ClientMission
  missionEmptyStringArray: Array<string>
  setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void
  handleChange: () => void
}): JSX.Element | null {
  /* -- PROPS -- */

  let active: boolean = props.active
  let mission: ClientMission = props.mission
  let missionEmptyStringArray: Array<string> = props.missionEmptyStringArray
  let setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void =
    props.setMissionEmptyStringArray
  let handleChange = props.handleChange

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { notify } = globalContext.actions

  /* -- COMPONENT STATE -- */

  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [deliverIntroMessageError, setDeliverIntroMessageError] =
    useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>(
    'At least one character is required here.',
  )

  /* -- COMPONENT FUNCTIONS -- */

  const removeMissionEmptyString = (field: string) => {
    missionEmptyStringArray.map((missionEmptyString: string, index: number) => {
      if (
        missionEmptyString === `missionID=${mission.missionID}_field=${field}`
      ) {
        missionEmptyStringArray.splice(index, 1)
      }
    })
  }

  // This is called when a user requests
  // to toggle a mission between being live
  // and not being live.
  const handleToggleLiveRequest = async (live: boolean) => {
    // Track previous live state in case of error.
    let previousLiveState: boolean = mission.live

    try {
      // Update state.
      mission.live = live
      setLiveAjaxStatus(EAjaxStatus.Loading)

      // Make the request to the server.
      await ClientMission.setLive(mission.missionID, live)

      // Notify the user of success.
      if (live) {
        notify(`${mission.name} is now live.`)
        setLiveAjaxStatus(EAjaxStatus.Loaded)
      } else {
        notify(`${mission.name} is now no longer live.`)
        setLiveAjaxStatus(EAjaxStatus.Loaded)
      }
    } catch (error) {
      // Notify user of error.
      if (live) {
        notify(`Failed to make \"${mission.name}\"  go live.`)
        setLiveAjaxStatus(EAjaxStatus.Error)
      } else {
        notify(`Failed to make \"${mission.name}\" no longer live.`)
        setLiveAjaxStatus(EAjaxStatus.Error)
      }
      // Revert mission.live to the previous state.
      mission.live = previousLiveState
    }
  }

  /* -- RENDER -- */

  if (active) {
    return (
      <div className='MissionEntry SidePanel'>
        <div className='BorderBox'>
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
          </div>
          <div className='SidePanelSection MainDetails'>
            <Detail
              label='Name'
              initialValue={mission.name}
              deliverValue={(name: string) => {
                if (name !== '') {
                  mission.name = name
                  removeMissionEmptyString('name')
                  setDeliverNameError(false)
                  handleChange()
                } else {
                  setDeliverNameError(true)
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=name`,
                  ])
                }
              }}
              options={{
                deliverError: deliverNameError,
                deliverErrorMessage: errorMessage,
              }}
              key={`${mission.missionID}_name`}
            />
            <DetailBox
              label='Introduction Message'
              initialValue={mission.introMessage}
              deliverValue={(introMessage: string) => {
                if (introMessage !== '') {
                  mission.introMessage = introMessage
                  removeMissionEmptyString('introMessage')
                  setDeliverIntroMessageError(false)
                  handleChange()
                } else {
                  setDeliverIntroMessageError(true)
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=introMessage`,
                  ])
                }
              }}
              options={{
                deliverError: deliverIntroMessageError,
                deliverErrorMessage: errorMessage,
              }}
              key={`${mission.missionID}_introMessage`}
            />
            <DetailToggle
              label={'Live'}
              initialValue={mission.live}
              deliverValue={(live: boolean) => {
                handleToggleLiveRequest(live)
                handleChange()
              }}
            />
            <DetailNumber
              label='Initial Resources'
              initialValue={mission.initialResources}
              deliverValue={(initialResources: number | null) => {
                if (initialResources !== null) {
                  mission.initialResources = initialResources
                  handleChange()
                }
              }}
              key={`${mission.missionID}_initialResources`}
            />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}
