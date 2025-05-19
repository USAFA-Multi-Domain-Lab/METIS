import { useState } from 'react'
import {
  DetailDropdown,
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from 'src/components/content/form/DetailDropdown'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks/lifecycles'
import { TMissionComponentArg } from '../../../../../../../shared/target-environments/args/mission-component'

/**
 * Renders a dropdown for the argument whose type is `"action"`.
 */
export default function ArgAction({
  arg: { name, type, tooltipDescription },
  existsInEffectArgs,
  actionIsActive,
  isRequired,
  isOptional,
  forceValue: [forceValue],
  optionalForceValue: [optionalForceValue],
  nodeValue: [nodeValue],
  optionalNodeValue: [optionalNodeValue],
  actionValue: [actionValue, setActionValue],
  optionalActionValue: [optionalActionValue, setOptionalActionValue],
}: TArgAction_P): JSX.Element | null {
  /* -- STATE -- */

  /**
   * How to handle an action that no longer exists in the selected node.
   * @note **A warning message is displayed upon initialization if the action
   * is not found in the selected node.**
   * @note **Post-initialization, the action is set to the first action in the
   * node's actions if the action is not found in the selected node.**
   */
  const [handleInvalidRequiredAction, setInvalidRequiredActionHandler] =
    useState<TRequiredHandleInvalidOption<ClientMissionAction>>(() => {
      if (existsInEffectArgs) {
        return {
          method: 'warning',
          message:
            `"${actionValue.name}" is no longer available in the node selected above. ` +
            `This is likely due to the action being deleted. Please select a valid action, or delete this effect.`,
        }
      } else {
        return {
          method: 'warning',
        }
      }
    })
  /**
   * How to handle an action that no longer exists in the selected node.
   * @note **A warning message is displayed upon initialization if the action
   * is not found in the selected node.**
   * @note **Post-initialization, the action is set to the first action in the
   * node's actions if the action is not found in the selected node.**
   */
  const [handleInvalidOptionalAction, setInvalidOptionalActionHandler] =
    useState<TOptionalHandleInvalidOption<ClientMissionAction | null>>(() => {
      if (existsInEffectArgs) {
        return {
          method: 'warning',
          message:
            `"${optionalActionValue?.name}" is no longer available in the node selected above. ` +
            `This is likely due to the action being deleted. Please select a valid action, or delete this effect.`,
        }
      } else {
        return {
          method: 'warning',
        }
      }
    })

  /* -- COMPUTED -- */
  /**
   * The list of actions to display in the dropdown.
   */
  const actions: ClientMissionAction[] = compute(() => {
    if (isOptional) return Array.from(optionalNodeValue?.actions.values() ?? [])
    return Array.from(nodeValue.actions.values())
  })
  /**
   * Determines if the method for handling an invalid action should
   * be set to the first action in the list or not.
   * @note **The first action should be selected if a previously selected action
   * is no longer available in the node selected above or if the node is no longer
   * available in the force selected above.**
   */
  const selectFirstAction: boolean = compute(() => {
    if (
      isRequired &&
      actionIsActive &&
      forceValue.nodes.includes(nodeValue) &&
      !nodeValue.actions.has(actionValue._id) &&
      handleInvalidRequiredAction.method === 'warning'
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the action value should be set to the default value
   * in the effect's arguments.
   */
  const selectDefaultAction: boolean = compute(() => {
    if (
      isOptional &&
      actionIsActive &&
      optionalForceValue !== null &&
      optionalNodeValue !== null &&
      optionalForceValue.nodes.includes(optionalNodeValue) &&
      optionalActionValue !== null &&
      !optionalNodeValue.actions.has(optionalActionValue._id) &&
      handleInvalidOptionalAction.method === 'warning'
    ) {
      return true
    }

    return false
  })

  /**
   * The tooltip description to display for an action argument.
   */
  const actionTooltip: string = compute(() => {
    if (type === 'action' && tooltipDescription) {
      return tooltipDescription
    }
    return ''
  })

  /**
   * The label to display for the action dropdown.
   */
  const label: string = compute(() => (type === 'action' ? name : 'Action'))

  /**
   * Determines if the action dropdown should be displayed or not.
   */
  const hide: boolean = compute(() => {
    if (!actionIsActive) return true

    // If the arg is required and the selected node is not in the
    // selected force.
    if (isRequired && !forceValue.nodes.includes(nodeValue)) return true

    // If the arg is optional and a force hasn't been selected yet.
    if (isOptional && !optionalForceValue) return true
    // If the arg is optional and a node hasn't been selected yet.
    if (isOptional && !optionalNodeValue) return true
    // If the arg is optional and the selected node is not in the
    // selected force.
    if (
      isOptional &&
      optionalNodeValue &&
      !optionalForceValue?.nodes.includes(optionalNodeValue)
    ) {
      return true
    }

    return false
  })

  /* -- EFFECTS -- */

  // Determines what to do with the selected action if a different
  // node is selected.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the node's value in the state changes and the first action
    // should be selected, then set the action's value to the first
    // action of the node selected above.
    if (selectFirstAction) {
      setInvalidRequiredActionHandler({
        method: 'setToFirst',
      })
    }

    // If the node's value in the state changes and the default action
    // should be selected, then set the action's value to null.
    if (selectDefaultAction) {
      setInvalidOptionalActionHandler({
        method: 'setToDefault',
        defaultValue: null,
      })
    }
  }, [nodeValue, optionalNodeValue])

  /* -- RENDER -- */

  if (hide) return null

  if (isOptional) {
    return (
      <DetailDropdown<ClientMissionAction>
        fieldType={'optional'}
        label={label}
        options={actions}
        stateValue={optionalActionValue}
        setState={setOptionalActionValue}
        isExpanded={false}
        tooltipDescription={actionTooltip}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={handleInvalidOptionalAction}
        emptyText='All actions'
      />
    )
  }

  return (
    <DetailDropdown<ClientMissionAction>
      fieldType={'required'}
      label={label}
      options={actions}
      stateValue={actionValue}
      setState={setActionValue}
      isExpanded={false}
      tooltipDescription={actionTooltip}
      getKey={({ _id }) => _id}
      render={({ name }) => name}
      handleInvalidOption={handleInvalidRequiredAction}
    />
  )
}

/* ---------------------------- TYPES FOR ACTION ARG ---------------------------- */

/**
 * The props for the `ArgAction` component.
 */
type TArgAction_P = {
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  existsInEffectArgs: boolean
  /**
   * Determines if the action should be present in the effect's arguments
   * and if the action dropdown should be displayed.
   */
  actionIsActive: boolean
  /**
   * Determines if the argument is required.
   */
  isRequired: boolean
  /**
   * Determines if the argument is optional.
   */
  isOptional: boolean
  /**
   * The force value to display in the dropdown.
   */
  forceValue: TReactState<ClientMissionForce>
  /**
   * The optional force value to display in the dropdown.
   */
  optionalForceValue: TReactState<ClientMissionForce | null>
  /**
   * The node value to display in the dropdown.
   */
  nodeValue: TReactState<ClientMissionNode>
  /**
   * The optional node value to display in the dropdown.
   */
  optionalNodeValue: TReactState<ClientMissionNode | null>
  /**
   * The action value to display in the dropdown.
   */
  actionValue: TReactState<ClientMissionAction>
  /**
   * The optional action value to display in the dropdown.
   */
  optionalActionValue: TReactState<ClientMissionAction | null>
}
