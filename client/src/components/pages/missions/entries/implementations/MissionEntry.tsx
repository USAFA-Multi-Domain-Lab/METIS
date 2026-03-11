import Divider from '@client/components/content/form/Divider'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TResource } from '@shared/missions/Mission'
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
  const [resources, setResources] = useState<TResource[]>(mission.resources)

  /* -- EFFECTS -- */

  // Sync the component state with the mission.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the mission resources.
    mission.resources = resources

    // Allow the user to save the changes.
    onChange(mission)
  }, [name, resources])

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
      {/* todo: Put in separate component. */}
      {resources.map((resource, index) => (
        <DetailString
          fieldType='required'
          handleOnBlur='repopulateValue'
          label={
            resources.length > 1
              ? `Resource ${index + 1} Label`
              : 'Resource Label'
          }
          value={resource.label}
          setValue={(arg) => {
            setResources((prev) => {
              let label = typeof arg === 'function' ? arg(prev[index].label) : arg
              return prev.map((r, i) => (i === index ? { ...r, label } : r))
            })
          }}
          defaultValue='Resources'
          maxLength={ClientMission.MAX_POOL_LABEL_LENGTH}
          disabled={viewMode === 'preview'}
          key={`${mission._id}_resource_${resource._id}`}
        />
      ))}
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
