import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { v4 as generateHash } from 'uuid'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import {
  EMiniButtonSVGPurpose,
  MiniButtonSVG,
} from '../user-controls/MiniButtonSVG'
import { MiniButtonSVGPanel } from '../user-controls/MiniButtonSVGPanel'
import './ActionEntry.scss'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  missionPath,
  isEmptyString,
  areDefaultValues,
  actionEmptyStringArray,
  setActionEmptyStringArray,
  setMissionPath,
  selectNode,
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
   * The class name for the top of the box.
   */
  const boxTopClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BoxTop']

    // If there is at least one empty field, add the error class.
    if (isEmptyString || areDefaultValues) {
      classList.push('IsError')
    }

    // If the action is new then add the "New" class name,
    // to properly display the close button.
    if (!node.actions.has(action.actionID)) {
      classList.push('New')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
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

    // If the action is new then hide the delete button.
    if (!node.actions.has(action.actionID)) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the new effect button.
   */
  const newEffectClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['NewEffect']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString || areDefaultValues) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the list of effects.
   */
  const effectsClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['AltDesign2']

    // If there is at least one empty field, add the error class.
    if (
      isEmptyString ||
      areDefaultValues
      // !node.actions.has(action.actionID)
    ) {
      classList.unshift('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the back arrow.
   */
  const backButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['BackButton']

    // If there is at least one empty field, add the disabled class.
    if (isEmptyString || areDefaultValues) {
      classList.push('Disabled')
    }

    // If the action is new then hide the back button.
    if (!node.actions.has(action.actionID)) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the close button.
   */
  const closeButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Close']

    // If the action is not new then hide the close button.
    if (node.actions.has(action.actionID)) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => {
    return action.node.mission.name
  })
  /**
   * The name of the node.
   */
  const nodeName: string = compute(() => {
    return action.node.name
  })
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
   * The class name for the mission path.
   */
  const pathClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Path']

    // If the action is new then disable the path
    // to keep the user from navigating away.
    if (!node.actions.has(action.actionID)) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  /**
   * The class name for the create button.
   */
  const createButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Button']

    // If the action is not new then hide the create button.
    if (node.actions.has(action.actionID)) {
      classList.push('Hidden')
    } else {
      // If there is an empty field ||
      // If there are default values...
      // then disable the create button.
      if (isEmptyString || areDefaultValues) {
        // Disable the create button.
        classList.push('Disabled')
      }
    }

    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */
  /**
   * Removes the actionID and field from the actionEmptyStringArray.
   * @note This function is called when a field is no longer empty.
   */
  const removeActionEmptyString = (field: string) => {
    // Remove the actionID and field from the actionEmptyStringArray.
    actionEmptyStringArray.map((actionEmptyString: string, index: number) => {
      // If the actionID and field match, remove it from the array.
      if (actionEmptyString === `actionID=${action.actionID}_field=${field}`) {
        // Remove the actionID and field from the actionEmptyStringArray.
        actionEmptyStringArray.splice(index, 1)
      }
    })
  }

  /**
   * Deletes the action from the node.
   */
  const handleDeleteActionRequest = () => {
    // Remove the action from the node.
    node.actions.delete(action.actionID)
    // Reset the actionEmptyStringArray.
    setActionEmptyStringArray([])
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
    if (index === 0) {
      selectNode(null)
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

  /**
   * Handles creating the action.
   */
  const createAction = () => {
    node.actions.set(action.actionID, action)
    handleChange()
  }

  /* -- RENDER -- */

  if (node.executable) {
    return (
      <div className='ActionEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className={boxTopClassName}>
            <div className='BackContainer'>
              <div
                className={backButtonClassName}
                onClick={() => setSelectedAction(null)}
              >
                &lt;
                <Tooltip description='Go back.' />
              </div>
            </div>
            <div className='ErrorMessage'>
              Fix all errors before closing panel.
            </div>
            <div className={pathClassName}>
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
            <div
              className={closeButtonClassName}
              onClick={() => setSelectedAction(null)}
            >
              <div className='CloseButton'>
                x
                <Tooltip description='Cancel' />
              </div>
            </div>
          </div>

          {/* -- MAIN CONTENT -- */}
          <div className='SidePanelSection'>
            <Detail
              label='Name'
              initialValue={action.name}
              deliverValue={(name: string) => {
                if (name !== '') {
                  action.name = name
                  setMissionPath([missionName, nodeName, name])
                  removeActionEmptyString('name')
                  handleChange()
                } else {
                  setActionEmptyStringArray([
                    ...actionEmptyStringArray,
                    `actionID=${action.actionID}_field=name`,
                  ])
                }
              }}
              options={{
                placeholder: 'Enter name...',
                deliverError: isEmptyString,
                deliverErrorMessage: 'At least one character is required here.',
              }}
              key={`${action.actionID}_name`}
            />
            <DetailBox
              label='Description'
              initialValue={action.description}
              deliverValue={(description: string) => {
                action.description = description

                // Equivalent to an empty string.
                if (description !== '<p><br></p>') {
                  removeActionEmptyString('description')
                  handleChange()
                } else {
                  setActionEmptyStringArray([
                    ...actionEmptyStringArray,
                    `actionID=${action.actionID}_field=description`,
                  ])
                }
              }}
              options={{
                elementBoundary: '.BorderBox',
                placeholder: 'Enter description...',
              }}
              key={`${action.actionID}_description`}
            />
            <DetailNumber
              label='Success Chance'
              initialValue={successChance}
              options={{
                minimum: 0,
                maximum: 100,
                unit: '%',
              }}
              deliverValue={(
                successChancePercentage: number | null | undefined,
              ) => {
                if (
                  successChancePercentage !== null &&
                  successChancePercentage !== undefined
                ) {
                  action.successChance = successChancePercentage / 100.0

                  handleChange()
                }
              }}
              key={`${action.actionID}_successChance`}
            />
            <DetailNumber
              label='Process Time'
              initialValue={processTime}
              options={{
                minimum: 0,
                maximum: 3600,
                unit: 's',
              }}
              deliverValue={(timeCost: number | null | undefined) => {
                if (timeCost !== null && timeCost !== undefined) {
                  action.processTime = timeCost * 1000

                  handleChange()
                }
              }}
              key={`${action.actionID}_timeCost`}
            />
            <DetailNumber
              label='Resource Cost'
              initialValue={action.resourceCost}
              deliverValue={(resourceCost: number | null | undefined) => {
                if (resourceCost !== null && resourceCost !== undefined) {
                  action.resourceCost = resourceCost

                  handleChange()
                }
              }}
              key={`${action.actionID}_resourceCost`}
            />
            <DetailBox
              label='Post-Execution Success Text'
              initialValue={action.postExecutionSuccessText}
              deliverValue={(postExecutionSuccessText: string) => {
                action.postExecutionSuccessText = postExecutionSuccessText

                // Equivalent to an empty string.
                if (postExecutionSuccessText !== '<p><br></p>') {
                  removeActionEmptyString('postExecutionSuccessText')
                  handleChange()
                } else {
                  setActionEmptyStringArray([
                    ...actionEmptyStringArray,
                    `actionID=${action.actionID}_field=postExecutionSuccessText`,
                  ])
                }
              }}
              options={{
                elementBoundary: '.BorderBox',
              }}
              key={`${action.actionID}_postExecutionSuccessText`}
            />
            <DetailBox
              label='Post-Execution Failure Text'
              initialValue={action.postExecutionFailureText}
              deliverValue={(postExecutionFailureText: string) => {
                action.postExecutionFailureText = postExecutionFailureText

                // Equivalent to an empty string.
                if (postExecutionFailureText !== '<p><br></p>') {
                  removeActionEmptyString('postExecutionFailureText')
                  handleChange()
                } else {
                  setActionEmptyStringArray([
                    ...actionEmptyStringArray,
                    `actionID=${action.actionID}_field=postExecutionFailureText`,
                  ])
                }
              }}
              options={{
                elementBoundary: '.BorderBox',
              }}
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
                  let buttons: MiniButtonSVG[] = []

                  // If the action is available then add the edit and remove buttons.
                  let availableMiniActions = {
                    edit: new MiniButtonSVG({
                      ...MiniButtonSVG.defaultProps,
                      purpose: EMiniButtonSVGPurpose.Edit,
                      handleClick: () => handleEditEffectRequest(effect),
                      tooltipDescription: 'Edit effect.',
                    }),
                    remove: new MiniButtonSVG({
                      ...MiniButtonSVG.defaultProps,
                      purpose: EMiniButtonSVGPurpose.Remove,
                      handleClick: () => handleDeleteEffectRequest(effect),
                      tooltipDescription: 'Remove effect.',
                    }),
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
                    <MiniButtonSVGPanel
                      buttons={actionButtons}
                      linkBack={null}
                    />
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
              listSpecificItemClassName={effectsClassName}
            />

            {/* -- NEW EFFECT BUTTON -- */}
            <div className={newEffectClassName}>
              <div className='ButtonContainer'>
                <div
                  className='FormButton AddEffect'
                  onClick={() =>
                    setSelectedEffect(
                      new ClientEffect(action, {
                        id: generateHash(),
                        args: {},
                      }),
                    )
                  }
                >
                  <span className='Text'>
                    <span className='LeftBracket'>[</span> New Effect{' '}
                    <span className='RightBracket'>]</span>
                    <Tooltip description='Create a new action.' />
                  </span>
                </div>
              </div>
            </div>

            {/* -- BUTTONS -- */}
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
              <div className={createButtonClassName} onClick={createAction}>
                Create Action
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
   * The path showing the user's location in the side panel.
   * @note This will help the user understand what they are editing.
   */
  missionPath: string[]
  /**
   * A boolean that will determine if a field has been left empty.
   */
  isEmptyString: boolean
  /**
   * A boolean that will determine if a field has default values.
   */
  areDefaultValues: boolean
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  actionEmptyStringArray: string[]
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setActionEmptyStringArray: (actionEmptyStringArray: string[]) => void
  /**
   * A function that will set the mission path.
   */
  setMissionPath: (missionPath: string[]) => void
  /**
   * A function that will set the node that is selected.
   */
  selectNode: (node: ClientMissionNode | null) => void
  /**
   * A function that will set the action that is selected.
   */
  setSelectedAction: (action: ClientMissionAction | null) => void
  /**
   * A function that will set the effect that is selected.
   */
  setSelectedEffect: (effect: ClientEffect | null) => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
