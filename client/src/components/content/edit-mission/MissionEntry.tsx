import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
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
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [missionName, setMissionName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
  const [initialResources, setInitialResources] = useState<string>(
    `${mission.initialResources}`,
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
    mission.initialResources = parseInt(initialResources)

    // Allow the user to save the changes.
    handleChange()
  }, [introMessage, initialResources])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
      <div className='BackContainer'>
        <div className='BackButton Disabled'>&lt;</div>
      </div>
    )
  }
  /**
   * Renders JSX for the path of the mission.
   */
  const renderPathJsx = (): JSX.Element | null => {
    return (
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
    )
  }

  /* -- RENDER -- */

  if (active) {
    return (
      <div className='MissionEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <div className='ErrorMessage Hidden'></div>
            {renderBackButtonJsx()}
            {renderPathJsx()}
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
              key={`${mission._id}_name`}
            />
            <DetailLargeString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Introduction Message'
              stateValue={introMessage}
              setState={setIntroMessage}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.introMessage}
              elementBoundary='.BorderBox'
              key={`${mission._id}_introMessage`}
            />
            <DetailNumber
              fieldType='required'
              label='Initial Resources'
              stateValue={initialResources}
              setState={setInitialResources}
              integersOnly={true}
              key={`${mission._id}_initialResources`}
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
