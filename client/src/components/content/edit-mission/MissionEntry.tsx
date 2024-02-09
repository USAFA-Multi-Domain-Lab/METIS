import ClientMission from 'src/missions'
import { useState } from 'react'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import { Detail, DetailBox, DetailNumber, DetailToggle } from '../form/Form'
import './MissionEntry.scss'
import { useGlobalContext } from 'src/context'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry(props: {
  /**
   * Whether or not this component is active.
   */
  active: boolean
  /**
   * The mission to be edited.
   */
  mission: ClientMission
  /**
   * An array of empty strings that will be used to
   * track which fields are empty.
   */
  missionEmptyStringArray: Array<string>
  /**
   * A function that will be used to set the
   * missionEmptyStringArray.
   */
  setMissionEmptyStringArray: (missionEmptyString: Array<string>) => void
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
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

  const [liveAjaxStatus, setLiveAjaxStatus] = useState<TAjaxStatus>('NotLoaded')
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
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
      setLiveAjaxStatus('Loading')

      // Make the request to the server.
      await ClientMission.setLive(mission.missionID, live)

      // Notify the user of success.
      if (live) {
        notify(`"${mission.name}" is now live.`)
        setLiveAjaxStatus('Loaded')
      } else {
        notify(`"${mission.name}" is no longer live.`)
        setLiveAjaxStatus('Loaded')
      }
    } catch (error) {
      // Notify user of error.
      if (live) {
        notify(`Failed to make \"${mission.name}\"  go live.`)
        setLiveAjaxStatus('Error')
      } else {
        notify(`Failed to make \"${mission.name}\" no longer live.`)
        setLiveAjaxStatus('Error')
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
                mission.introMessage = introMessage

                if (introMessage !== '<p><br></p>') {
                  removeMissionEmptyString('introMessage')
                  handleChange()
                } else {
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=introMessage`,
                  ])
                }
              }}
              options={{
                elementBoundary: '.BorderBox',
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
              deliverValue={(initialResources: number | null | undefined) => {
                if (
                  initialResources !== null &&
                  initialResources !== undefined
                ) {
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
