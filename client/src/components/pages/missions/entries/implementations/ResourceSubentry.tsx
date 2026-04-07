import { DetailString } from '@client/components/content/form/DetailString'
import { DetailIconSelector } from '@client/components/content/form/icon-selectors/DetailIconSelector'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionResource } from '@client/missions/ClientMissionResource'
import { useObjectFormSync, usePostInitEffect } from '@client/toolbox/hooks'
import { MissionResource } from '@shared/missions/MissionResource'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useRef, useState } from 'react'

// ! Styling in Entry.scss.

/**
 * Renders the editable label field for a single resource,
 * embedded within the {@link MissionEntry} component.
 */
export default function ResourceSubentry({
  resource,
  mission,
  newlyAdded = false,
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
  const [usingDefaultName, setUsingDefaultName] = useState<boolean>(
    name === MissionResource.DEFAULT_NAMES[icon],
  )
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

  /* -- COMPUTED -- */

  let rootClasses = new ClassList('ResourceSubentry', 'Subentry').set(
    'UsingDefaultName',
    usingDefaultName,
  )

  /* -- EFFECTS -- */

  // This will update the resource's name when
  // the icon changes, but only if the default
  // name is currently in use for the previous
  // icon. If this is the case, then the name
  // will be updated to the new icon's default
  // name.
  let previousIcon = useRef<TMetisIcon>(icon)
  usePostInitEffect(() => {
    let currentName = name
    let nextDefaultName = ClientMissionResource.DEFAULT_NAMES[icon]

    if (
      nextDefaultName &&
      currentName === ClientMissionResource.DEFAULT_NAMES[previousIcon.current]
    ) {
      setName(nextDefaultName)
    }

    return () => {
      previousIcon.current = icon
    }
  }, [icon])

  usePostInitEffect(() => {
    setUsingDefaultName(name === MissionResource.DEFAULT_NAMES[icon])
  }, [name])

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue='Resources'
        maxLength={ClientMission.MAX_RESOURCE_NAME_LENGTH}
        disabled={viewMode === 'preview'}
        uniqueFieldClassName='FieldResourceName'
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
   * Indicates if the resource was newly added, or
   * if it pre-existed this component's lifecycle.
   */
  newlyAdded?: boolean
  /**
   * Called when the user requests to remove this resource.
   */
  onClickDelete: (resource: ClientMissionResource) => void
}
