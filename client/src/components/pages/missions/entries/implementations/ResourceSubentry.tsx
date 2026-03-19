import { DetailString } from '@client/components/content/form/DetailString'
import type { TSelectableIcon } from '@client/components/content/form/dropdowns/icons/DetailIconSelector'
import { DetailIconSelector } from '@client/components/content/form/dropdowns/icons/DetailIconSelector'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import type { TMetisClientComponents } from '@client/index'
import { ClientMission } from '@client/missions/ClientMission'
import { useObjectFormSync } from '@client/toolbox/hooks'
import type { MissionResource } from '@shared/missions/MissionResource'
import { useState } from 'react'

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
  const [icon, setIcon] = useState<TSelectableIcon>('coins')
  const {
    name: [name, setName],
  } = useObjectFormSync(resource, ['name'], {
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
        icons={[
          'coins',
          'flag',
          'gear',
          'key',
          'lightning',
          'node',
          'shield',
          'waves',
        ]}
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
  resource: MissionResource<TMetisClientComponents>
  /**
   * The mission that owns the resource.
   */
  mission: ClientMission
  /**
   * Called when the user requests to remove this resource.
   */
  onClickDelete: (resource: MissionResource<TMetisClientComponents>) => void
}
