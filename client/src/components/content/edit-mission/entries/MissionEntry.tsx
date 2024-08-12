import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission, { TMissionDefectiveObject } from 'src/missions'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useMountHandler, usePostInitEffect } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import List, { ESortByMethod } from '../../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/ButtonSvgPanel'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  handleDeleteEffectRequest,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions
  const [targetEnvironments] = globalContext.targetEnvironments

  /* -- STATE -- */
  const [name, setName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
  const [initialResources, setInitialResources] = useState<number>(
    mission.initialResources,
  )
  const [defectiveObjects, setDefectiveObjects] = useState<
    TMissionDefectiveObject[]
  >(mission.defectiveObjects)

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled, remount] = useMountHandler(async (done) => {
    await mission.evaluateObjects({
      key: 'effects',
      targetEnvironments,
    })
    setDefectiveObjects(mission.defectiveObjects)
    done()
  })

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the introduction message.
    mission.introMessage = introMessage
    // Update the initial resources.
    mission.initialResources = initialResources

    // Allow the user to save the changes.
    handleChange()
  }, [name, introMessage, initialResources])

  // This displays the change of the mission's name found at
  // the bottom left of the mission map.
  useEffect(() => forceUpdate(), [name])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (object: TMissionDefectiveObject) => {
    /* -- COMPUTED -- */

    /**
     * The buttons for the object list.
     */
    const buttons = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []
      // Create a list of mini actions that are available.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {}

      // If the object is an effect, then create mini actions for it.
      if (object instanceof ClientEffect) {
        // If the action is available then add the edit and remove buttons.
        availableMiniActions = {
          warning: {
            icon: 'warning-transparent',
            key: 'warning',
            onClick: () => {},
            cursor: 'help',
            tooltipDescription: object.invalidMessage,
          },
          remove: {
            icon: 'remove',
            key: 'remove',
            onClick: async () => {
              await handleDeleteEffectRequest(object)
              remount()
            },
            tooltipDescription: 'Delete effect.',
          },
        }
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`object-row-${object._id}`}>
        <div
          className='RowContent Select'
          onClick={() => mission.select(object)}
        >
          {object.name}
          <Tooltip description='Click to resolve.' />
        </div>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
      </div>
    )
  }

  /* -- RENDER -- */
  if (mountHandled) {
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
            <DetailNumber
              fieldType='required'
              label='Initial Resources'
              stateValue={initialResources}
              setState={setInitialResources}
              integersOnly={true}
              key={`${mission._id}_initialResources`}
            />
            {defectiveObjects.length > 0 ? (
              <List<TMissionDefectiveObject>
                items={defectiveObjects}
                renderItemDisplay={(object) => renderObjectListItem(object)}
                headingText={'Warnings'}
                sortByMethods={[ESortByMethod.Name]}
                nameProperty={'name'}
                alwaysUseBlanks={false}
                searchableProperties={['name']}
                noItemsDisplay={null}
                ajaxStatus={'Loaded'}
                applyItemStyling={() => {
                  return {}
                }}
                listStyling={{ borderBottom: '2px solid #ffffff' }}
                itemsPerPage={null}
                listSpecificItemClassName='AltDesign2'
              />
            ) : null}
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
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
   * Handles the request to delete an effect.
   */
  handleDeleteEffectRequest: (
    effect: ClientEffect,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
