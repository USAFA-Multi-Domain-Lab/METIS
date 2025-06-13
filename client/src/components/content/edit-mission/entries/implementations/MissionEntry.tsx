import { useRef, useState } from 'react'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/v3/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/v3/hooks'
import { useMissionPageContext } from 'src/components/pages/MissionPage'
import ClientMission from 'src/missions'
import {
  useMountHandler,
  usePostInitEffect,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import MissionComponent from '../../../../../../../shared/missions/component'
import Tooltip from '../../../communication/Tooltip'
import { DetailString } from '../../../form/DetailString'
import ListOld, { ESortByMethod } from '../../../general-layout/ListOld'
import Entry from '../Entry'

/**
 * The amount of time between checks for
 * defective components in the mission.
 */
const DEFECT_INTERVAL_TIME = 1000 // ms

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  onChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- STATE -- */

  const { state } = useMissionPageContext()
  const [checkForDefects, setCheckForDefects] = state.checkForDefects
  const [defectiveComponents, setDefectiveComponents] =
    state.defectiveComponents
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )
  const warningButtonEngine = useButtonSvgEngine({
    elements: [
      {
        type: 'button',
        icon: 'warning-transparent',
        cursor: 'help',
        description:
          'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
      },
    ],
  })
  const defectTimeout = useRef<number | undefined>(undefined)

  /* -- EFFECTS -- */

  // Create an interval to check for defective components
  // within the mission.
  useMountHandler(() => {
    const callback = () => {
      // Every interval, if flagged to recheck
      // for defects, update the state to the
      // defective components in the mission, which
      // is a computed property.
      if (checkForDefects) {
        setDefectiveComponents(mission.defectiveComponents)
        setCheckForDefects(false)
      }
    }

    defectTimeout.current = window.setInterval(callback, DEFECT_INTERVAL_TIME)
    callback() // Initial check
  }, [])
  useUnmountHandler(() => clearInterval(defectTimeout.current))

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

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (component: MissionComponent<any, any>) => {
    return (
      <div className='Row IconFirst' key={`object-row-${component._id}`}>
        <ButtonSvgPanel engine={warningButtonEngine} />
        <div
          className='RowContent Select'
          onClick={() => mission.select(component)}
        >
          {component.defectiveMessage}
          <Tooltip description='Click to resolve.' />
        </div>
      </div>
    )
  }

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
        key={`${mission._id}_resourceLabel`}
      />
      {defectiveComponents.length > 0 ? (
        <ListOld<MissionComponent<any, any>>
          items={defectiveComponents}
          renderItemDisplay={(object) => renderObjectListItem(object)}
          headingText={'Unresolved Conflicts'}
          sortByMethods={[ESortByMethod.Name]}
          nameProperty={'name'}
          alwaysUseBlanks={false}
          searchableProperties={['name']}
          noItemsDisplay={null}
          ajaxStatus={'Loaded'}
          applyItemStyling={() => {
            return {}
          }}
          itemsPerPage={null}
          listSpecificItemClassName='AltDesign2'
        />
      ) : null}
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
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   * @param mission The same mission that was passed.
   */
  onChange: (mission: ClientMission) => void
}
