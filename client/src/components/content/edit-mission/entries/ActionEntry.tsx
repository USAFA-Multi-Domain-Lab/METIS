import { useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import {
  useObjectFormSync,
  usePostInitEffect,
  useRequireLogin,
} from 'src/toolbox/hooks'
import ClassList from '../../../../../../shared/toolbox/html/class-lists'
import Tooltip from '../../communication/Tooltip'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import Divider from '../../form/Divider'
import ListOld, { ESortByMethod } from '../../general-layout/ListOld'
import { TButtonSvgType } from '../../user-controls/buttons/ButtonSvg'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function ActionEntry({
  action,
  action: { node, mission },
  setIsNewEffect,
  handleDeleteActionRequest,
  handleDeleteEffectRequest,
  onChange,
}: TActionEntry_P): JSX.Element | null {
  /* -- STATE -- */

  const actionState = useObjectFormSync(
    action,
    [
      'name',
      'description',
      'successChanceHidden',
      'processTimeHidden',
      'resourceCost',
      'resourceCostHidden',
      'opensNode',
      'opensNodeHidden',
      'postExecutionSuccessText',
      'postExecutionFailureText',
    ],
    { onChange: () => onChange(action) },
  )
  const [name, setName] = actionState.name
  const [description, setDescription] = actionState.description
  const [successChance, setSuccessChance] = useState<number>(
    parseFloat(`${(action.successChance * 100.0).toFixed(2)}`),
  )
  const [successChanceHidden, hideSuccessChance] =
    actionState.successChanceHidden
  const [processTime, setProcessTime] = useState<number>(
    action.processTime / 1000,
  )
  const [processTimeHidden, hideProcessTime] = actionState.processTimeHidden
  const [resourceCost, setResourceCost] = actionState.resourceCost
  const [resourceCostHidden, hideResourceCost] = actionState.resourceCostHidden
  const [opensNode, setOpensNode] = actionState.opensNode
  const [opensNodeHidden, hideOpensNode] = actionState.opensNodeHidden
  const [postExecutionSuccessText, setPostExecutionSuccessText] =
    actionState.postExecutionSuccessText
  const [postExecutionFailureText, setPostExecutionFailureText] =
    actionState.postExecutionFailureText
  const { login } = useRequireLogin()

  /* -- COMPUTED -- */

  /**
   * The class name for the new effect button.
   */
  const newEffectButtonClasses = compute<ClassList>(() => {
    let classList = new ClassList()
    classList.set('Disabled', !ClientTargetEnvironment.REGISTRY.populated)
    return classList
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
    // Update the success chance and the process time.
    action.successChance = successChance / 100
    action.processTime = processTime * 1000

    // Allow the user to save the changes.
    onChange(action)
  }, [successChance, processTime])

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
      if (!effect.environment || !effect.target) {
        return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
      } else if (login.user.isAuthorized('missions_write')) {
        return 'Edit effect.'
      } else if (login.user.isAuthorized('missions_read')) {
        return 'View effect.'
      } else {
        return ''
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
      if (!effect.environment || !effect.target) {
        classList.push('PartiallyDisabled')
      }

      // Combine the class names into a single string.
      return classList.join(' ')
    })

    /**
     * The buttons for the effect list.
     */
    const buttons: TButtonSvgType[] = compute(() => ['remove'])

    return (
      <div className='Row Select' key={`effect-row-${effect._id}`}>
        <div
          className={rowContentClassName}
          onClick={() => mission.select(effect)}
        >
          {effect.name}
          <Tooltip description={editTooltipDescription} />
        </div>
        <ButtonSvgPanel_v2
          buttons={buttons}
          onButtonClick={async () => await handleDeleteEffectRequest(effect)}
          getTooltip={() => 'Delete effect.'}
        />
      </div>
    )
  }

  /* -- RENDER -- */

  // Render nothing if the action is not executable.
  if (!node.executable) return null

  return (
    <div className='Entry ActionEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <EntryNavigation component={action} />
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelContent'>
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
            placeholder='Enter description...'
            key={`${action._id}_description`}
          />
          <Divider />
          <DetailNumber
            fieldType='required'
            label='Success Chance'
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
          <DetailToggle
            fieldType='required'
            label='Hide'
            tooltipDescription='If enabled, the success chance will be hidden from the executor.'
            stateValue={successChanceHidden}
            setState={hideSuccessChance}
            key={`${action._id}_successChanceHidden`}
          />
          <Divider />
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
          <DetailToggle
            fieldType='required'
            label='Hide'
            tooltipDescription='If enabled, the process time will be hidden from the executor.'
            stateValue={processTimeHidden}
            setState={hideProcessTime}
            key={`${action._id}_processTimeHidden`}
          />
          <Divider />
          <DetailNumber
            fieldType='required'
            label='Resource Cost'
            stateValue={resourceCost}
            setState={setResourceCost}
            minimum={ClientMissionAction.RESOURCE_COST_MIN}
            integersOnly={true}
            key={`${action._id}_resourceCost`}
          />
          <DetailToggle
            fieldType='required'
            label='Hide'
            tooltipDescription='If enabled, the resource cost will be hidden from the executor.'
            stateValue={resourceCostHidden}
            setState={hideResourceCost}
            key={`${action._id}_resourceCostHidden`}
          />
          <Divider />
          <DetailToggle
            fieldType='required'
            label='Opens Node'
            tooltipDescription='If enabled, this action will open the node if successfully executed.'
            stateValue={opensNode}
            setState={setOpensNode}
            key={`${action._id}_opensNode`}
          />
          <DetailToggle
            fieldType='required'
            label='Hide'
            tooltipDescription='If enabled, the opens node option will be hidden from the executor.'
            stateValue={opensNodeHidden}
            setState={hideOpensNode}
            key={`${action._id}_opensNodeHidden`}
          />
          <Divider />
          <DetailLargeString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='Post-Execution Success Text'
            stateValue={postExecutionSuccessText}
            setState={setPostExecutionSuccessText}
            defaultValue={
              ClientMissionAction.DEFAULT_PROPERTIES.postExecutionSuccessText
            }
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
            key={`${action._id}_postExecutionFailureText`}
          />
          <Divider />

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
              uniqueClassName={newEffectButtonClasses.value}
            />
          </div>

          <Divider />
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
   * Callback for when a change is made that would
   * require saving.
   * @param action The same action passed.
   */
  onChange: (action: ClientMissionAction) => void
}
