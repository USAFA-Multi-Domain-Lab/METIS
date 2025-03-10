import { useEffect, useState } from 'react'
import ClientMission, { TMissionComponent } from 'src/missions'
import { compute } from 'src/toolbox'
import { useMountHandler, usePostInitEffect } from 'src/toolbox/hooks'
import Tooltip from '../../communication/Tooltip'
import { DetailString } from '../../form/DetailString'
import ListOld, { ESortByMethod } from '../../general-layout/ListOld'
import ButtonSvg from '../../user-controls/buttons/ButtonSvg'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- STATE -- */
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )
  const [defectiveObjects, setDefectiveObjects] = useState<TMissionComponent[]>(
    mission.defectiveObjects,
  )

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler((done) => {
    // Evaluate the objects to determine if they are defective.
    // Stop if there are 500 defective objects or more.
    mission.evaluateObjects(500)
    setDefectiveObjects(mission.defectiveObjects)
    done()
  })

  // Finish evaluating the objects, if necessary.
  useEffect(() => {
    if (mountHandled && defectiveObjects.length === 500) {
      mission.evaluateObjects()
      setDefectiveObjects(mission.defectiveObjects)
    }
  }, [mountHandled])

  // Update the defective objects when they change elsewhere.
  useEffect(() => {
    setDefectiveObjects(mission.defectiveObjects)
  }, [mission.defectiveObjects.length])

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the mission resource label.
    mission.resourceLabel = resourceLabel

    // Allow the user to save the changes.
    handleChange()
  }, [name, resourceLabel])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (object: TMissionComponent) => {
    /* -- COMPUTED -- */

    /**
     * Tooltip description for the object list item.
     */
    const description: string = compute(
      () =>
        'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
    )

    return (
      <div className='Row IconFirst' key={`object-row-${object._id}`}>
        <ButtonSvg
          type='warning-transparent'
          cursor='help'
          description={description}
          onClick={() => {}}
        />
        <div
          className='RowContent Select'
          onClick={() => mission.select(object)}
        >
          {object.defectiveMessage}
          <Tooltip description='Click to resolve.' />
        </div>
      </div>
    )
  }

  /* -- RENDER -- */
  return (
    <div className='Entry MissionEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation object={mission} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelContent'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Name'
            stateValue={name}
            setState={setName}
            defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
            maxLength={ClientMission.MAX_NAME_LENGTH}
            key={`${mission._id}_name`}
          />
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Resource Label'
            stateValue={resourceLabel}
            setState={setResourceLabel}
            defaultValue={ClientMission.DEFAULT_PROPERTIES.resourceLabel}
            maxLength={ClientMission.MAX_RESOURCE_LABEL_LENGTH}
            key={`${mission._id}_resourceLabel`}
          />

          {defectiveObjects.length > 0 ? (
            <ListOld<TMissionComponent>
              items={defectiveObjects}
              renderItemDisplay={(object) => renderObjectListItem(object)}
              headingText={'Unresolved Conflicts'}
              sortByMethods={[ESortByMethod.Name]}
              nameProperty={'name'}
              alwaysUseBlanks={false}
              searchableProperties={['name']}
              noItemsDisplay={null}
              ajaxStatus={defectiveObjects.length > 0 ? 'Loaded' : 'Loading'}
              applyItemStyling={() => {
                return {}
              }}
              itemsPerPage={null}
              listSpecificItemClassName='AltDesign2'
            />
          ) : null}
        </div>
      </div>
    </div>
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
   */
  handleChange: () => void
}
