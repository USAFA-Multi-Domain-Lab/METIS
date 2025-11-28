import Divider from '@client/components/content/form/Divider'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import { usePostInitEffect } from '@client/toolbox/hooks'
import { useState } from 'react'
import { DetailString } from '../../../../content/form/DetailString'
import { EffectTimeline } from '../../target-effects/timelines'
import Entry from '../Entry'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
}: TMissionEntry_P): TReactElement | null {
  /* -- STATE -- */

  const { onChange, viewMode } = useMissionPageContext()
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )

  /* -- EFFECTS -- */

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the mission resource label.
    mission.resourceLabel = resourceLabel

    // Allow the user to save the changes.
    onChange(mission)
  }, [name, resourceLabel])

  /* -- RENDER -- */
  return (
    <Entry missionComponent={mission}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
        maxLength={ClientMission.MAX_NAME_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_name`}
      />
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Resource Label'
        value={resourceLabel}
        setValue={setResourceLabel}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.resourceLabel}
        maxLength={ClientMission.MAX_RESOURCE_LABEL_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_resourceLabel`}
      />
      <Divider />
      <EffectTimeline<'sessionTriggeredEffect'> host={mission} />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

/**
 * The props for the `MissionEntry` component.
 */
type TMissionEntry_P = {
  /**
   * The mission to be edited.
   */
  mission: ClientMission
}
