import { useState } from 'react'
import { useMissionPageContext } from 'src/components/pages/MissionPage'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { TMissionComponent } from '../../../../../../../shared/missions'
import Tooltip from '../../../communication/Tooltip'
import { DetailString } from '../../../form/DetailString'
import ListOld, { ESortByMethod } from '../../../general-layout/ListOld'
import ButtonSvg from '../../../user-controls/buttons/ButtonSvg'
import Entry from '../Entry'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  onChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- STATE -- */
  const { state } = useMissionPageContext()
  const [defectiveComponents] = state.defectiveComponents
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )
  /* -- EFFECTS -- */

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
  const renderObjectListItem = (component: TMissionComponent<any, any>) => {
    /* -- COMPUTED -- */

    /**
     * Tooltip description for the object list item.
     */
    const description: string = compute(
      () =>
        'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
    )

    return (
      <div className='Row IconFirst' key={`object-row-${component._id}`}>
        <ButtonSvg
          type='warning-transparent'
          cursor='help'
          description={description}
          onClick={() => {}}
        />
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
        <ListOld<TMissionComponent<any, any>>
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
