import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionNode from 'src/missions/nodes'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import List, { ESortByMethod } from '../../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/ButtonSvgPanel'
import { ButtonText } from '../../user-controls/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  targetEnvironments,
  setIsNewEffect,
  handleChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */

  const { forceUpdate, prompt } = useGlobalContext().actions

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
   * The mission for the action.
   */
  const mission = compute(() => node.mission)

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
    // Select the now-deleted action's node.
    mission.selectBack()
    // Remove the action from the node.
    node.actions.delete(action._id)
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Handles the request to delete an effect.
   */
  const handleDeleteEffectRequest = (effect: ClientEffect) => {
    // Filter out the effect from the action.
    action.effects = action.effects.filter(
      (actionEffect: ClientEffect) => actionEffect._id !== effect._id,
    )

    // Display the changes.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }

  /**
   * Handles the request to edit an effect.
   */
  const handleEditEffectRequest = (effect: ClientEffect) => {
    // If the effect has a target and a target environment,
    // then select the effect.
    if (effect.target && effect.targetEnvironment) {
      mission.select(effect)
    }
  }

  /**
   * Renders JSX for the effect list item.
   */
  const renderEffectListItem = (effect: ClientEffect) => {
    /* -- COMPUTED -- */
    /**
     * The tooltip description for the edit button.
     */
    const editTooltipDescription: string = compute(() => {
      if (!effect.target) {
        return 'This effect cannot be edited because the target associated with this effect is not available.'
      } else if (!effect.targetEnvironment) {
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
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
        edit: {
          icon: 'edit',
          key: 'edit',
          onClick: () => handleEditEffectRequest(effect),
          tooltipDescription: editTooltipDescription,
          disabled:
            !effect.target || !effect.targetEnvironment ? 'partial' : 'none',
        },
        remove: {
          icon: 'remove',
          key: 'remove',
          onClick: () => handleDeleteEffectRequest(effect),
          tooltipDescription: 'Remove effect.',
        },
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`effect-row-${effect._id}`}>
        <div className='RowContent'>
          {effect.name}
          <Tooltip description={effect.description} />
        </div>
        <ButtonSvgPanel buttons={actionButtons} size={'small'} />
      </div>
    )
  }

  /* -- RENDER -- */

  if (node.executable) {
    return (
      <div className='Entry ActionEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <EntryNavigation object={action} />
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
              key={`${action._id}_name`}
            />
            <DetailLargeString
              fieldType='optional'
              handleOnBlur='none'
              label='Description'
              stateValue={description}
              setState={setDescription}
              elementBoundary='.SidePanelSection'
              placeholder='Enter description...'
              key={`${action._id}_description`}
            />
            <DetailNumber
              fieldType='required'
              label='Success Chance'
              stateValue={successChance}
              setState={setSuccessChance}
              minimum={0}
              maximum={100}
              integersOnly={true}
              unit='%'
              key={`${action._id}_successChance`}
            />
            <DetailNumber
              fieldType='required'
              label='Process Time'
              stateValue={processTime}
              setState={setProcessTime}
              minimum={0}
              maximum={3600}
              unit='s'
              key={`${action._id}_timeCost`}
            />
            <DetailNumber
              fieldType='required'
              label='Resource Cost'
              stateValue={resourceCost}
              setState={setResourceCost}
              minimum={0}
              integersOnly={true}
              key={`${action._id}_resourceCost`}
            />
            <DetailLargeString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Post-Execution Success Text'
              stateValue={postExecutionSuccessText}
              setState={setPostExecutionSuccessText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
              }
              elementBoundary='.SidePanelSection'
              key={`${action._id}_postExecutionSuccessText`}
            />
            <DetailLargeString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Post-Execution Failure Text'
              stateValue={postExecutionFailureText}
              setState={setPostExecutionFailureText}
              defaultValue={
                ClientMissionAction.DEFAULT_PROPERTIES.postExecutionFailureText
              }
              elementBoundary='.SidePanelSection'
              key={`${action._id}_postExecutionFailureText`}
            />

            {/* -- EFFECTS -- */}
            <List<ClientEffect>
              items={action.effects}
              renderItemDisplay={(effect) => renderEffectListItem(effect)}
              headingText={'Effects'}
              sortByMethods={[ESortByMethod.Name]}
              nameProperty={'name'}
              alwaysUseBlanks={false}
              searchableProperties={['name']}
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
                onClick={() => setIsNewEffect(true)}
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
   * Function that updates the isNewEffect state.
   */
  setIsNewEffect: ReactSetter<boolean>
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
