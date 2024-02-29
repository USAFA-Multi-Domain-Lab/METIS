import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import { Detail, DetailBox, DetailNumber, DetailToggle } from '../form/Form'
import './MissionEntry.scss'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  active,
  mission,
  missionPath,
  missionEmptyStringArray,
  setMissionEmptyStringArray,
  setMissionPath,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { notify } = useGlobalContext().actions

  /* -- STATE -- */
  const [_, setLiveAjaxStatus] = useState<TAjaxStatus>('NotLoaded')

  /* -- FUNCTIONS -- */

  /**
   * If a field that was previously left empty meets the
   * requirements then this will remove the key that was
   * stored when the field was empty which will let the
   * user know that the field has met its requirements
   * when the state updates.
   * @param field The field that was previously left empty.
   */
  const removeMissionEmptyString = (field: string) => {
    missionEmptyStringArray.map((missionEmptyString: string, index: number) => {
      if (
        missionEmptyString === `missionID=${mission.missionID}_field=${field}`
      ) {
        missionEmptyStringArray.splice(index, 1)
      }
    })
  }

  /**
   * This is called when a user requests to toggle a mission between being live
   * and not being live.
   * @param live Whether or not the mission is live.
   */
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
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
            <div className='BackContainer'>
              <div className='BackButton Disabled'>&lt;</div>
            </div>
            <div className='Path'>
              Location:{' '}
              {missionPath.map((position: string, index: number) => {
                return (
                  <span className='Position' key={`position-${index}`}>
                    <span className='PositionText'>{position}</span>{' '}
                    {index === missionPath.length - 1 ? '' : ' > '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* -- MAIN CONTENT -- */}
          <div className='SidePanelSection MainDetails'>
            <Detail
              label='Name'
              initialValue={mission.name}
              deliverValue={(name: string) => {
                if (name !== '') {
                  mission.name = name
                  setMissionPath([mission.name])
                  removeMissionEmptyString('name')
                  handleChange()
                } else {
                  setMissionEmptyStringArray([
                    ...missionEmptyStringArray,
                    `missionID=${mission.missionID}_field=name`,
                  ])
                }
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

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

export type TMissionEntry_P = {
  /**
   * Whether or not this component is active.
   */
  active: boolean
  /**
   * The mission to be edited.
   */
  mission: ClientMission
  /**
   * The path showing the user's location in the side panel.
   * @note This will help the user understand what they are editing.
   */
  missionPath: string[]
  /**
   * An array of empty strings that will be used to
   * track which fields are empty.
   */
  missionEmptyStringArray: string[]
  /**
   * A function that will be used to set the
   * missionEmptyStringArray.
   */
  setMissionEmptyStringArray: (missionEmptyString: string[]) => void
  /**
   * A function that will set the mission path.
   */
  setMissionPath: (missionPath: string[]) => void
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
