import { DetailString } from '@client/components/content/form/DetailString'
import { DetailIconSelector } from '@client/components/content/form/icon-selectors/DetailIconSelector'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientMissionResource } from '@client/missions/ClientMissionResource'
import {
  useEventListener,
  useObjectFormSync,
  usePostInitEffect,
} from '@client/toolbox/hooks'
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
  const [nameSilentlySet, setNameSilentlySet] = useState<boolean>(false)
  const [nameWasTouched, setNameWasTouched] = useState(!newlyAdded)
  const rootElementRef = useRef<HTMLDivElement>(null)
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
    'NameUntouched',
    !nameWasTouched,
  )

  /* -- EFFECTS -- */

  // Mark name as having been touched by the user
  // when the mission is saved, since that is a
  // strong signal that the user is satisfied with
  // the name.
  useEventListener(mission, 'save', () => setNameWasTouched(true))

  usePostInitEffect(() => setNameWasTouched(!newlyAdded), [newlyAdded])

  // If the name changes from user input (not from other hook),
  // mark the name as having been touched by the user.
  usePostInitEffect(() => {
    if (!nameSilentlySet) {
      setNameWasTouched(true)
    } else {
      setNameSilentlySet(false)
    }
  }, [name])

  // If the icon changes, update the name to the
  // default name for the icon, if the user has never
  // edited or saved the name before.
  usePostInitEffect(() => {
    let rootElement = rootElementRef.current
    let nameInputElement = rootElement?.querySelector<HTMLInputElement>(
      '.FieldResourceName input',
    )
    let correspondingName = MissionResource.DEFAULT_NAMES[icon]

    if (!nameWasTouched && correspondingName && nameInputElement) {
      setNameSilentlySet(true)
      setName(correspondingName)
    }
  }, [icon])

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value} ref={rootElementRef}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue='Resources'
        uniqueFieldClassName='FieldResourceName'
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
   * Indicates if the resource was newly added, or
   * if it pre-existed this component's lifecycle.
   */
  newlyAdded?: boolean
  /**
   * Called when the user requests to remove this resource.
   */
  onClickDelete: (resource: ClientMissionResource) => void
}
