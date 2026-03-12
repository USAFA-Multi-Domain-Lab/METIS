import Divider from '@client/components/content/form/Divider'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import EntryControlPanel from '@client/components/pages/missions/entries/EntryControlPanel'
import { ClientMission } from '@client/missions/ClientMission'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TResource } from '@shared/missions/Mission'
import { Mission } from '@shared/missions/Mission'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { Fragment, useState } from 'react'
import { DetailString } from '../../../../content/form/DetailString'
import { EffectTimeline } from '../../target-effects/timelines'
import Entry from '../Entry'
import ResourceSubentry from './ResourceSubentry'

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

  const addResourceEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'add',
        type: 'button',
        icon: 'add',
        description: 'Add resource',
        disabled: resources.length >= Mission.MAX_RESOURCE_TYPES,
        permissions: ['missions_write'],
        onClick: onClickAdd,
      },
    ],
    dependencies: [resources.length],
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for when the add button is clicked, adding a new
   * resource to the mission.
   */
  function onClickAdd(): void {
    setResources((previous) => [
      ...previous,
      {
        _id: StringToolbox.generateRandomId(),
        name: 'Resources',
        order: Math.max(...previous.map((resource) => resource.order)) + 1,
      },
    ])
  }

  /**
   * Callback for when the remove button is clicked on a resource,
   * removing it from the mission.
   * @param resource The resource to remove.
   */
  function onClickDelete(resource: TResource): void {
    setResources((previous) =>
      previous.filter((existingResource) => existingResource !== resource),
    )
  }

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
      <Divider />
      <EntryControlPanel heading='Resources' engine={addResourceEngine} />
      {resources.map((resource) => (
        <Fragment key={`${mission._id}_resource_${resource._id}`}>
          <ResourceSubentry
            resource={resource}
            mission={mission}
            onClickDelete={onClickDelete}
          />
          <Divider />
        </Fragment>
      ))}
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
