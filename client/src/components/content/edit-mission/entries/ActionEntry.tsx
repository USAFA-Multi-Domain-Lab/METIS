import { useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import ListOld, { ESortByMethod } from '../../general-layout/ListOld'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/buttons/ButtonSvgPanel'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  action: { node },
  action: { mission },
  setIsNewEffect,
  handleDeleteActionRequest,
  handleDeleteEffectRequest,
  handleChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [name, setName] = useState<string>(action.name)
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
  const [targetEnvironments] = useState<ClientTargetEnvironment[]>(
    ClientTargetEnvironment.getAll(),
  )

  /* -- COMPUTED -- */

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
  /**
   * The tooltip description for the (action) delete button.
   */
  const deleteTooltipDescription: string = compute(() => {
    if (node.actions.size < 2) {
      return 'This action cannot be deleted because the node must have at least one action if it is executable.'
    } else {
      return 'Delete action.'
    }
  })

  /* -- EFFECTS -- */

  // Sync the component state with the action.
  usePostInitEffect(() => {
    // Update the action name.
    action.name = name
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
    name,
    description,
    successChance,
    processTime,
    resourceCost,
    postExecutionSuccessText,
    postExecutionFailureText,
  ])

  // This displays the change in the mission path found at
  // the top of the side panel.
  useEffect(() => forceUpdate(), [name])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderEffectListItem = (effect: ClientEffect) => {
    /* -- COMPUTED -- */
    /**
     * The tooltip description for the edit button.
     */
    const editTooltipDescription: string = compute(() => {
      if (!effect.targetEnvironment || !effect.target) {
        return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
      } else {
        return 'Edit effect.'
      }
    })

    /**
     * The class name for the effect row content.
     */
    const rowContentClassName: string = compute(() => {
      // Create a default list of class names.
      let classList: string[] = ['RowContent', 'Select']

      // If the effect doesn't have a target or target environment,
      // then partially disable the effect.
      if (!effect.targetEnvironment || !effect.target) {
        classList.push('PartiallyDisabled')
      }

      // Combine the class names into a single string.
      return classList.join(' ')
    })

    /**
     * The buttons for the effect list.
     */
    const buttons: TValidPanelButton[] = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []

      // If the action is available then add the edit and remove buttons.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
        remove: {
          type: 'remove',
          key: 'remove',
          onClick: async () => await handleDeleteEffectRequest(effect),
          description: 'Delete effect.',
        },
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row Select' key={`effect-row-${effect._id}`}>
        <div
          className={rowContentClassName}
          onClick={() => mission.select(effect)}
        >
          {effect.name}
          <Tooltip description={editTooltipDescription} />
        </div>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
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
              stateValue={name}
              setState={setName}
              defaultValue={ClientMissionAction.DEFAULT_PROPERTIES.name}
              maxLength={ClientMissionAction.MAX_NAME_LENGTH}
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
              label='Probability of Success'
              stateValue={successChance}
              setState={setSuccessChance}
              // Convert to percentage.
              minimum={ClientMissionAction.SUCCESS_CHANCE_MIN * 100}
              // Convert to percentage.
              maximum={ClientMissionAction.SUCCESS_CHANCE_MAX * 100}
              integersOnly={true}
              unit='%'
              key={`${action._id}_successChance`}
            />
            <DetailNumber
              fieldType='required'
              label='Process Time'
              stateValue={processTime}
              setState={setProcessTime}
              // Convert to seconds.
              minimum={ClientMissionAction.PROCESS_TIME_MIN / 1000}
              // Convert to seconds.
              maximum={ClientMissionAction.PROCESS_TIME_MAX / 1000}
              unit='s'
              key={`${action._id}_timeCost`}
            />
            <DetailNumber
              fieldType='required'
              label='Resource Cost'
              stateValue={resourceCost}
              setState={setResourceCost}
              minimum={ClientMissionAction.RESOURCE_COST_MIN}
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
            <ListOld<ClientEffect>
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
              listStyling={{ borderBottom: 'unset' }}
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
                onClick={async () =>
                  await handleDeleteActionRequest(action, true)
                }
                tooltipDescription={deleteTooltipDescription}
                disabled={node.actions.size < 2 ? 'partial' : 'none'}
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
   * Function that updates the isNewEffect state.
   */
  setIsNewEffect: TReactSetter<boolean>
  /**
   * Handles the request to delete an action.
   */
  handleDeleteActionRequest: (
    action: ClientMissionAction,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * Handles the request to delete an effect.
   */
  handleDeleteEffectRequest: (
    effect: ClientEffect,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * Handles when a change is made that would require saving.
   */
  handleChange: () => void
}
