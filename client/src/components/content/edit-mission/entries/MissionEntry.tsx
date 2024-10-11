import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission, { TMissionComponent } from 'src/missions'
import { compute } from 'src/toolbox'
import { useMountHandler, usePostInitEffect } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailString } from '../../form/DetailString'
import ListOld, { ESortByMethod } from '../../general-layout/ListOld'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/buttons/ButtonSvgPanel'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions

  /* -- STATE -- */
  const [name, setName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
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

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the introduction message.
    mission.introMessage = introMessage

    // Allow the user to save the changes.
    handleChange()
  }, [name, introMessage])

  // This displays the change of the mission's name found at
  // the bottom left of the mission map.
  useEffect(() => forceUpdate(), [name])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (object: TMissionComponent) => {
    /* -- COMPUTED -- */

    /**
     * The buttons for the object list.
     */
    const buttons: TValidPanelButton[] = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []
      // Create a list of mini actions that are available.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
        warning: {
          type: 'warning-transparent',
          key: 'warning',
          onClick: () => {},
          cursor: 'help',
          description:
            'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
        },
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`object-row-${object._id}`}>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
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
        <div className='SidePanelSection MainDetails'>
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
          <DetailLargeString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Introduction Message'
            stateValue={introMessage}
            setState={setIntroMessage}
            defaultValue={ClientMission.DEFAULT_PROPERTIES.introMessage}
            elementBoundary='.SidePanelSection'
            key={`${mission._id}_introMessage`}
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
              listStyling={{
                borderBottom: '2px solid #ffffff',
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
