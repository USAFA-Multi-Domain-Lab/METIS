import { useRef } from 'react'
import { DetailLocked } from 'src/components/content/form/DetailLocked'
import { DetailToggle } from 'src/components/content/form/DetailToggle'
import Divider from 'src/components/content/form/Divider'
import ClientMissionFile from 'src/missions/files'
import { compute } from 'src/toolbox'
import { useObjectFormSync } from 'src/toolbox/hooks'
import Entry from '../Entry'

/**
 * This will render the basic editable details of a
 * mission file.
 */
export default function MissionFileEntry({
  file,
  onChange,
}: TMissionFileEntry_P): JSX.Element | null {
  /* -- PROPS -- */

  const { mission } = file

  /* -- STATE -- */

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
    initialAccess: [initialAccess, setInitialAccess],
  } = useObjectFormSync(file, ['initialAccess'], {
    onChange: () => onChange(file),
  })

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
    <Entry missionComponent={file}>
      <DetailLocked
        label='Original Name'
        stateValue={file.originalName}
        key={`${file._id}_originalName`}
      />
      {/* <DetailString
              fieldType='optional'
              handleOnBlur='none'
              label='Alias'
              stateValue={alias}
              setState={setAlias}
              defaultValue={ClientMissionFile.DEFAULT_PROPERTIES.alias}
              maxLength={ClientMission.MAX_NAME_LENGTH}
              key={`${file._id}_alias`}
            /> */}
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
  /**
   * A callback that will be used to notify the parent
   * component that this component has changed.
   * @param file The same file passed.
   */
  onChange: (file: ClientMissionFile) => void
}
