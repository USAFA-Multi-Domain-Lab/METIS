import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import { DetailMediumString, DetailNumber, DetailString } from '../form/Form'
import List, { ESortByMethod } from '../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../user-controls/ButtonSvgPanel'
import { ButtonText } from '../user-controls/ButtonText'
import './ActionEntry.scss'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  targetEnvironments,
  setSelectedAction,
  setSelectedEffect,
  handleChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [actionName, setActionName] = useState<string>(action.name)
  const [description, setDescription] = useState<string>(action.description)
  const [successChance, setSuccessChance] = useState<number>(
    parseFloat(`${(action.successChance * 100.0).toFixed(2)}`),
  )
  const [processTime, setProcessTime] = useState<number>(
    action.processTime / 1000,
  )
  const [resourceCost, setResourceCost] = useState<number>(action.resourceCost)
  const [postExecutionSuccessText, setPostExecutionSuccessText] =
    useState<string>(action.postExecutionSuccessText)
  const [postExecutionFailureText, setPostExecutionFailureText] =
    useState<string>(action.postExecutionFailureText)

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
   * The current location within the mission.
   */
  const missionPath: string[] = compute(() => [
    missionName,
    nodeName,
    actionName,
  ])
  /**
   * The class name for the delete action button.
   */
  const deleteActionClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = []

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
    let classList: string[] = []

    // If there are no target environments then disable the button.
    if (targetEnvironments.length === 0) {
      classList.push('Disabled')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the component state with the action.
  usePostInitEffect(() => {
    // Update the action name.
    action.name = actionName
    // Update the description.
    action.description = description
    // Update the success chance.
    action.successChance = successChance / 100
    // Update the process time.
    action.processTime = processTime * 1000
    // Update the resource cost.
    action.resourceCost = resourceCost
    // Update the post-execution success text.
    action.postExecutionSuccessText = postExecutionSuccessText
    // Update the post-execution failure text.
    action.postExecutionFailureText = postExecutionFailureText

    // Allow the user to save the changes.
    handleChange()
  }, [
    actionName,
    description,
    successChance,
    processTime,
    resourceCost,
    postExecutionSuccessText,
    postExecutionFailureText,
  ])

  /* -- FUNCTIONS -- */
  /**
   * Deletes the action from the node.
   */
  const handleDeleteActionRequest = () => {
    // Remove the action from the node.
    node.actions.delete(action.actionID)
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
    // Reset the selected action.
    setSelectedAction(null)
  }

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const handlePathPositionClick = (index: number) => {
    // If the index is 0 then take the user
    // back to the mission entry.
    if (index === 0) {
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

  /**
   * Handles the request to delete an effect.
   */
  const handleDeleteEffectRequest = (effect: ClientEffect) => {
    // Filter out the effect from the action.
    action.effects = action.effects.filter(
      (actionEffect: ClientEffect) => actionEffect.id !== effect.id,
    )
    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
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
            <DetailString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Name'
              stateValue={actionName}
              setState={setActionName}
              defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.name}
              placeholder='Enter name...'
              key={`${action.actionID}_name`}
            />
            <DetailMediumString
              fieldType='optional'
              handleOnBlur='none'
              label='Description'
              stateValue={description}
              setState={setDescription}
              elementBoundary='.BorderBox'
              placeholder='Enter description...'
              key={`${action.actionID}_description`}
            />
            <DetailNumber
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Success Chance'
              stateValue={successChance}
              setState={setSuccessChance}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.successChance * 100
              }
              minimum={0}
              maximum={100}
              unit='%'
              key={`${action.actionID}_successChance`}
            />
            <DetailNumber
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Process Time'
              stateValue={processTime}
              setState={setProcessTime}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.processTime / 1000
              }
              minimum={0}
              maximum={3600}
              unit='s'
              integersOnly={true}
              key={`${action.actionID}_timeCost`}
            />
            <DetailNumber
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Resource Cost'
              stateValue={resourceCost}
              setState={setResourceCost}
              defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.resourceCost}
              minimum={0}
              integersOnly={true}
              key={`${action.actionID}_resourceCost`}
            />
            <DetailMediumString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Post-Execution Success Text'
              stateValue={postExecutionSuccessText}
              setState={setPostExecutionSuccessText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
              }
              elementBoundary='.BorderBox'
              key={`${action.actionID}_postExecutionSuccessText`}
            />
            <DetailMediumString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Post-Execution Failure Text'
              stateValue={postExecutionFailureText}
              setState={setPostExecutionFailureText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
              }
              elementBoundary='.BorderBox'
              key={`${action.actionID}_postExecutionFailureText`}
            />

            {/* -- EFFECTS -- */}
            <List<ClientEffect>
              items={action.effects}
              renderItemDisplay={(effect: ClientEffect) => {
                /* -- COMPUTED -- */
                /**
                 * The class list for the edit button.
                 */
                const editButtonClassList: string[] = compute(() => {
                  // Create a default list of class names.
                  let classList: string[] = []

                  // If the effect cannot be edited then disable the button.
                  if (
                    effect.target === null ||
                    effect.targetEnvironment === null
                  ) {
                    classList.push('NoEdit')
                  }

                  // Return the class list.
                  return classList
                })

                /**
                 * The tooltip description for the edit button.
                 */
                const editTooltipDescription: string = compute(() => {
                  if (effect.target === null) {
                    return 'This effect cannot be edited because the target associated with this effect is not available.'
                  } else if (effect.targetEnvironment === null) {
                    return 'This effect cannot be edited because the target environment associated with this effect is not available.'
                  } else {
                    return 'Edit effect.'
                  }
                })

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
                        onClick: () => setSelectedEffect(effect),
                        tooltipDescription: editTooltipDescription,
                        uniqueClassList: editButtonClassList,
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
                  <div className='Row' key={`effect-row-${effect.id}`}>
                    <div className='RowContent'>
                      {effect.name}
                      <Tooltip description={effect.description} />
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
            <div className='ButtonContainer New'>
              <ButtonText
                text='New Effect'
                onClick={() => setSelectedEffect(new ClientEffect(action))}
                tooltipDescription='Create a new effect.'
                uniqueClassName={newEffectButtonClassName}
              />
            </div>

            {/* -- BUTTON(S) -- */}
            <div className='ButtonContainer'>
              <ButtonText
                text='Delete Action'
                onClick={handleDeleteActionRequest}
                tooltipDescription='Delete this action from the node.'
                uniqueClassName={deleteActionClassName}
              />
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
   * React setter function used to update the value stored
   * in a component's state.
   */
  setSelectedAction: ReactSetter<ClientMissionAction | null>
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setSelectedEffect: ReactSetter<ClientEffect | null>
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
