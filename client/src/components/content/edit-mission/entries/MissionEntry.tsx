import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [missionName, setMissionName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
  const [initialResources, setInitialResources] = useState<number>(
    mission.initialResources,
  )

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

  return (
    <div className='Entry MissionEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={mission} />
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
            elementBoundary='.SidePanelSection'
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
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

export type TMissionEntry_P = {
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
