import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import { DetailLargeString, DetailNumber, DetailString } from '../form/Form'
import './MissionEntry.scss'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  active,
  mission,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { notify, forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [_, setLiveAjaxStatus] = useState<TAjaxStatus>('NotLoaded')
  const [missionName, setMissionName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
  const [initialResources, setInitialResources] = useState<number>(
    mission.initialResources,
  )

  /* -- COMPUTED -- */
  /**
   * The current location within the mission.
   */
  const missionPath: string[] = compute(() => [missionName])

  /* -- EFFECTS -- */

  // Sync the component state with the mission name.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = missionName

    // This is to show the change to
    // the name of the mission shown
    // on the mission map.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }, [missionName])

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the introduction message.
    mission.introMessage = introMessage
    // Update the initial resources.
    mission.initialResources = initialResources

    // Allow the user to save the changes.
    handleChange()
  }, [introMessage, initialResources])

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
            <DetailString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Name'
              stateValue={missionName}
              setState={setMissionName}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
              key={`${mission.missionID}_name`}
            />
            <DetailLargeString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Introduction Message'
              stateValue={introMessage}
              setState={setIntroMessage}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.introMessage}
              elementBoundary='.BorderBox'
              key={`${mission.missionID}_introMessage`}
            />
            <DetailNumber
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Initial Resources'
              stateValue={initialResources}
              setState={setInitialResources}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.initialResources}
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
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
