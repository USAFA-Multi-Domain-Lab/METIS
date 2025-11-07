import { DetailLocked } from '@client/components/content/form/DetailLocked'
import { DetailString } from '@client/components/content/form/DetailString'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import Divider from '@client/components/content/form/Divider'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { compute } from '@client/toolbox'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { useRef } from 'react'
import Entry from '../Entry'

/**
 * This will render the basic editable details of a
 * mission file.
 */
export default function MissionFileEntry({
  file,
}: TMissionFileEntry_P): TReactElement | null {
  /* -- PROPS -- */

  const { mission } = file

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const initialAccessTracker = useRef(
    compute(() => {
      let result = new Map<string, boolean>()
      file.initialAccess.forEach((forceId) => {
        result.set(forceId, true)
      })
      return result
    }),
  )
  const {
    alias: [alias, setAlias],
    initialAccess: [initialAccess, setInitialAccess],
  } = useObjectFormSync(file, ['alias', 'initialAccess'], {
    onChange: () => onChange(file),
  })
  const svgEngine = useButtonSvgEngine({})

  /* -- FUNCTIONS -- */

  /**
   * Callback for any of the force-specific toggles
   * for initial access.
   * @param forceId The ID of the force toggled.
   * @param setStateAction React setter argument to
   * determine whether access for the given force is
   * enabled or not.
   */
  const onToggleForce = (
    forceId: string,
    setStateAction: Parameters<TReactSetter<boolean>>[0],
  ) => {
    let nextValue: boolean

    // Determine the next value.
    if (typeof setStateAction === 'function') {
      let prevValue = initialAccessTracker.current.get(forceId) ?? false
      nextValue = setStateAction(prevValue)
    } else {
      nextValue = setStateAction
    }

    // Update the state given the force ID.
    initialAccessTracker.current.set(forceId, nextValue)

    setInitialAccess(() => {
      let updatedValue: string[] = []
      initialAccessTracker.current.forEach((accessible, forceId) => {
        if (accessible) updatedValue.push(forceId)
      })
      return updatedValue
    })
  }

  /* -- RENDER -- */

  return (
    <Entry missionComponent={file} svgEngines={[svgEngine]}>
      <DetailLocked
        label='Original Name'
        stateValue={file.originalName}
        key={`${file._id}_originalName`}
      />
      <DetailString
        fieldType='optional'
        handleOnBlur='none'
        label='Alias'
        value={alias}
        setValue={setAlias}
        defaultValue={ClientMissionFile.DEFAULT_PROPERTIES.alias}
        maxLength={ClientMission.MAX_NAME_LENGTH}
        key={`${file._id}_alias`}
      />
      <Divider />
      <h4>INITIAL FORCE ACCESS</h4>
      {mission.forces.map((force) => {
        return (
          <DetailToggle
            label={force.name}
            key={`${file._id}_initialAccess_${force._id}`}
            value={initialAccess.includes(force._id)}
            setValue={(value) => onToggleForce(force._id, value)}
          />
        )
      })}
    </Entry>
  )
}

/* ---------------------------- TYPES FOR PROTOTYPE ENTRY ---------------------------- */

/**
 * Props for the `MissionFileEntry` component.
 */
export type TMissionFileEntry_P = {
  /**
   * The mission file to be edited.
   */
  file: ClientMissionFile
}
