import Divider from '@client/components/content/form/Divider'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import EntryHeader from '@client/components/pages/missions/entries/EntryHeader'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientMissionResource } from '@client/missions/ClientMissionResource'
import { useEventListener, useObjectFormSync } from '@client/toolbox/hooks'
import { Mission } from '@shared/missions/Mission'
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
  const [resources, setResources] = useState<ClientMissionResource[]>([
    ...mission.resources,
  ])
  const {
    name: [name, setName],
  } = useObjectFormSync(mission, ['name'], {
    onChange: () => onChange(mission),
  })

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
    let newResource = mission.addResource()
    onChange(newResource)
  }

  /**
   * Callback for when the remove button is clicked on a resource,
   * removing it from the mission.
   * @param resource The resource to remove.
   */
  function onClickDelete(resource: ClientMissionResource): void {
    resource.remove()
    onChange(resource)
  }

  /* -- EFFECTS -- */

  // On resource list change, update the state of this
  // component to reflect changes.
  useEventListener(mission, ['resource-list-change'], () => {
    setResources(mission.resources) // Getter returns new object every time.
  })

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
      <div className='Resources SubentryGroup'>
        <EntryHeader heading='Resources' engine={addResourceEngine} />
        {resources.map((resource) => (
          <Fragment key={`${mission._id}_resource_${resource._id}`}>
            <ResourceSubentry
              resource={resource}
              mission={mission}
              onClickDelete={onClickDelete}
            />
            <Divider key={`${mission._id}_divider_${resource._id}`} />
          </Fragment>
        ))}
      </div>
      <EffectTimeline<'sessionTriggeredEffect'> host={mission} />
      {/* todo: Remove this. */}
      {/* <Panel>
        <PanelView title='General'>
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
        </PanelView>
        <PanelView title='Resources'>
          <div className='Resources SubentryGroup'>
            <EntryHeader heading='Resources' engine={addResourceEngine} />
            {resources.map((resource) => (
              <Fragment key={`${mission._id}_resource_${resource._id}`}>
                <ResourceSubentry
                  resource={resource}
                  mission={mission}
                  onClickDelete={onClickDelete}
                />
                <Divider key={`${mission._id}_divider_${resource._id}`} />
              </Fragment>
            ))}
          </div>
        </PanelView>
        <PanelView title='Effects'>
          <EffectTimeline<'sessionTriggeredEffect'> host={mission} />
        </PanelView>
      </Panel> */}
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
