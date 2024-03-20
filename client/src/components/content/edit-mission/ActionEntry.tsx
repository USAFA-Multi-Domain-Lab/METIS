import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { v4 as generateHash } from 'uuid'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import './ActionEntry.scss'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  targetEnvironments,
  missionPath,
  setMissionPath,
  setSelectedAction,
  setSelectedEffect,
  handleChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The node on which the action is being executed.
   */
  const node: ClientMissionNode = compute(() => action.node)
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => action.mission.name)
  /**
   * The name of the node.
   */
  const nodeName: string = compute(() => action.node.name)
  /**
   * The chance that the action will succeed.
   */
  const successChance: number | undefined = compute(() => {
    // If the success chance is available, return it as a percentage.
    if (action.successChance) {
      return parseFloat(`${(action.successChance * 100.0).toFixed(2)}`)
    }
    // Otherwise, return the success chance.
    else {
      return action.successChance
    }
  })
  /**
   * The amount of time it takes to execute the action.
   */
  const processTime: number | undefined = compute(() => {
    // If the process time is available, convert it to seconds.
    if (action.processTime) {
      return action.processTime / 1000
    }
    // Otherwise, return the process time.
    else {
      return action.processTime
    }
  })
  /**
   * The class name for the delete action button.
   */
  const deleteActionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton', 'DeleteAction']

    // If there is only one action then disable the delete button.
    if (node.actions.size === 1) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the new effect button.
   */
  const newEffectButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Text']

    // If there are no target environments then disable the button.
    if (targetEnvironments.length === 0) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */
  /**
   * Deletes the action from the node.
   */
  const handleDeleteActionRequest = () => {
    // Remove the action from the node.
    node.actions.delete(action.actionID)
    // Reset the selected action.
    setSelectedAction(null)
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Handles the request to edit an effect.
   */
  const handleEditEffectRequest = (effect: ClientEffect) => {
    // Update the mission path.
    missionPath.push(effect.name || 'New Effect')
    // Set the selected effect.
    setSelectedEffect(effect)
  }

  /**
   * Handles the request to delete an effect.
   */
  const handleDeleteEffectRequest = (effect: ClientEffect) => {
    // Filter out the effect from the action.
    action.effects = action.effects.filter(
      (actionEffect: ClientEffect) => actionEffect.id !== effect.id,
    )
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const handlePathPositionClick = (index: number) => {
    // If the index is 0 then take the user
    // back to the mission entry.
    if (index === 0 && node !== null) {
      node.mission.deselectNode()
      setSelectedAction(null)
      setSelectedEffect(null)
    }
    // If the index is 1 then take the user
    // back to the node entry.
    else if (index === 1) {
      setSelectedAction(null)
      setSelectedEffect(null)
    }
  }

  /* -- RENDER -- */

  if (node.executable) {
    return (
      <div className='ActionEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <div className='BackContainer'>
              <div
                className='BackButton'
                onClick={() => setSelectedAction(null)}
              >
                &lt;
                <Tooltip description='Go back.' />
              </div>
            </div>
            <div className='Path'>
              Location:{' '}
              {missionPath.map((position: string, index: number) => {
                return (
                  <span className='Position' key={`position-${index}`}>
                    <span
                      className='PositionText'
                      onClick={() => handlePathPositionClick(index)}
                    >
                      {position}
                    </span>{' '}
                    {index === missionPath.length - 1 ? '' : ' > '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* -- MAIN CONTENT -- */}
          <div className='SidePanelSection'>
            <Detail
              label='Name'
              currentValue={action.name}
              defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.name}
              deliverValue={(name: string) => {
                action.name = name
                setMissionPath([missionName, nodeName, name])
                handleChange()
              }}
              placeholder='Enter name...'
              key={`${action.actionID}_name`}
            />
            <DetailBox
              label='Description'
              currentValue={action.description}
              deliverValue={(description: string) => {
                action.description = description
                handleChange()
              }}
              elementBoundary='.BorderBox'
              placeholder='Enter description...'
              displayOptionalText={true}
              key={`${action.actionID}_description`}
            />
            <DetailNumber
              label='Success Chance'
              currentValue={successChance}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.successChance * 100.0
              }
              emptyValueAllowed={false}
              minimum={0}
              maximum={100}
              unit='%'
              deliverValue={(successChancePercentage: number | null) => {
                if (successChancePercentage !== null) {
                  action.successChance = successChancePercentage / 100.0
                  handleChange()
                }
              }}
              key={`${action.actionID}_successChance`}
            />
            <DetailNumber
              label='Process Time'
              currentValue={processTime}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.processTime / 1000
              }
              emptyValueAllowed={false}
              minimum={0}
              maximum={3600}
              unit='s'
              deliverValue={(timeCost: number | null) => {
                if (timeCost !== null) {
                  action.processTime = timeCost * 1000
                  handleChange()
                }
              }}
              key={`${action.actionID}_timeCost`}
            />
            <DetailNumber
              label='Resource Cost'
              currentValue={action.resourceCost}
              defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.resourceCost}
              emptyValueAllowed={false}
              minimum={0}
              deliverValue={(resourceCost: number | null) => {
                if (resourceCost !== null) {
                  action.resourceCost = resourceCost
                  handleChange()
                }
              }}
              key={`${action.actionID}_resourceCost`}
            />
            <DetailBox
              label='Post-Execution Success Text'
              currentValue={action.postExecutionSuccessText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
              }
              deliverValue={(postExecutionSuccessText: string) => {
                action.postExecutionSuccessText = postExecutionSuccessText
                handleChange()
              }}
              elementBoundary='.BorderBox'
              key={`${action.actionID}_postExecutionSuccessText`}
            />
            <DetailBox
              label='Post-Execution Failure Text'
              currentValue={action.postExecutionFailureText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
              }
              deliverValue={(postExecutionFailureText: string) => {
                action.postExecutionFailureText = postExecutionFailureText
                handleChange()
              }}
              elementBoundary='.BorderBox'
              key={`${action.actionID}_postExecutionFailureText`}
            />

            {/* -- EFFECTS -- */}
            <List<ClientEffect>
              items={action.effects}
              renderItemDisplay={(effect: ClientEffect) => {
                /* -- COMPUTED -- */
                /**
                 * The buttons for the effect list.
                 */
                const actionButtons = compute(() => {
                  // Create a default list of buttons.
                  let buttons: TValidPanelButton[] = []

                  // If the action is available then add the edit and remove buttons.
                  let availableMiniActions: SingleTypeObject<TValidPanelButton> =
                    {
                      edit: {
                        icon: 'edit',
                        key: 'edit',
                        onClick: () => handleEditEffectRequest(effect),
                        tooltipDescription: 'Edit effect.',
                      },
                      remove: {
                        icon: 'remove',
                        key: 'remove',
                        onClick: () => handleDeleteEffectRequest(effect),
                        tooltipDescription: 'Remove effect.',
                      },
                    }

                  // Add the buttons to the list.
                  buttons.push(availableMiniActions.edit)
                  buttons.push(availableMiniActions.remove)

                  // Return the buttons.
                  return buttons
                })

                return (
                  <div className='EffectRow' key={`effect-row-${effect.id}`}>
                    <div className='Effect'>
                      {effect.name}
                      <Tooltip description={effect.description ?? ''} />
                    </div>
                    <ButtonSvgPanel buttons={actionButtons} size={'small'} />
                  </div>
                )
              }}
              headingText={'Effects:'}
              sortByMethods={[ESortByMethod.Name]}
              nameProperty={'name'}
              alwaysUseBlanks={false}
              searchableProperties={['id']}
              noItemsDisplay={
                <div className='NoContent'>No effects available...</div>
              }
              ajaxStatus={'Loaded'}
              applyItemStyling={() => {
                return {}
              }}
              itemsPerPage={null}
              listSpecificItemClassName='AltDesign2'
            />

            {/* -- NEW EFFECT BUTTON -- */}
            <div className='NewEffect'>
              <div className='ButtonContainer'>
                <div
                  className='FormButton CreateNewEffect'
                  onClick={() =>
                    setSelectedEffect(
                      new ClientEffect(action, {
                        id: generateHash(),
                        args: {},
                      }),
                    )
                  }
                >
                  <span className={newEffectButtonClassName}>
                    <span className='LeftBracket'>[</span> New Effect{' '}
                    <span className='RightBracket'>]</span>
                    <Tooltip description='Create a new effect.' />
                  </span>
                </div>
              </div>
            </div>

            {/* -- BUTTON(S) -- */}
            <div className='ButtonContainer'>
              <div
                className={deleteActionClassName}
                key={`${action.actionID}_delete`}
              >
                <span className='Text' onClick={handleDeleteActionRequest}>
                  <span className='LeftBracket'>[</span> Delete Action{' '}
                  <span className='RightBracket'>]</span>
                  <Tooltip description='Delete this action from the node.' />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR NODE ACTION ENTRY ---------------------------- */

/**
 * Props for NodeActionEntry component
 */
export type TActionEntry_P = {
  /**
   * The mission-node-action to be edited.
   */
  action: ClientMissionAction
  /**
   * List of target environments to apply effects to.
   */
  targetEnvironments: ClientTargetEnvironment[]
  /**
   * The path showing the user's location in the side panel.
   * @note This will help the user understand what they are editing.
   */
  missionPath: string[]
  /**
   * A function that will set the mission path.
   */
  setMissionPath: (missionPath: string[]) => void
  /**
   * A function that will set the action that is selected.
   */
  setSelectedAction: (action: ClientMissionAction | null) => void
  /**
   * A function that will set the effect that is selected.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
