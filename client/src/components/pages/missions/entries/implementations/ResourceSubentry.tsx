import { DetailString } from '@client/components/content/form/DetailString'
import { DetailIconSelector } from '@client/components/content/form/icon-selectors/DetailIconSelector'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientMissionResource } from '@client/missions/ClientMissionResource'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { MissionResource } from '@shared/missions/MissionResource'

// ! Styling in Entry.scss.

/**
 * Renders the editable label field for a single resource,
 * embedded within the {@link MissionEntry} component.
 */
export default function ResourceSubentry({
  resource,
  mission,
  onClickDelete,
}: TResourceSubentry_P): TReactElement {
  /* -- STATE -- */

  const { onChange, viewMode } = useMissionPageContext()
  const {
    name: [name, setName],
    icon: [icon, setIcon],
  } = useObjectFormSync(resource, ['name', 'icon'], {
    onChange: () => onChange(mission),
  })

  /* -- COMPUTED -- */

  /**
   * Engine controlling resource manipulation options
   * within the subentry.
   */
  const buttonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete resource',
        disabled: mission.resources.length < 2,
        permissions: ['missions_write'],
        onClick: () => onClickDelete(resource),
      },
    ],
    dependencies: [mission.resources.length],
  })

  /* -- RENDER -- */

  return (
    <div className='ResourceSubentry Subentry'>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue='Resources'
        maxLength={ClientMission.MAX_RESOURCE_NAME_LENGTH}
        disabled={viewMode === 'preview'}
      />
      <ButtonSvgPanel engine={buttonEngine} />
      <DetailIconSelector
        label='Icon'
        value={icon}
        setValue={setIcon}
        icons={new Set(MissionResource.ICONS)}
        disabled={viewMode === 'preview'}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ResourceSubentry}.
 */
type TResourceSubentry_P = {
  /**
   * The resource whose label is being edited.
   */
  resource: ClientMissionResource
  /**
   * The mission that owns the resource.
   */
  mission: ClientMission
  /**
   * Called when the user requests to remove this resource.
   */
  onClickDelete: (resource: ClientMissionResource) => void
}
