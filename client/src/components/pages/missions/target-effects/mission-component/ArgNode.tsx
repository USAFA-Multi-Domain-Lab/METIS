import {
  DetailDropdown,
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from 'metis/client/components/content/form/dropdown/'
import ClientMissionForce from 'metis/client/missions/forces'
import ClientMissionNode from 'metis/client/missions/nodes'
import { compute } from 'metis/client/toolbox'
import { usePostInitEffect } from 'metis/client/toolbox/hooks/lifecycles'
import { TMissionComponentArg } from 'metis/target-environments/args/mission-component'
import { useState } from 'react'

/**
 * Renders a dropdown for the argument whose type is `"node"`.
 */
export default function ArgNode({
  arg: { name, type, tooltipDescription },
  existsInEffectArgs,
  nodeIsActive,
  isRequired,
  isOptional,
  forceValue: [forceValue],
  optionalForceValue: [optionalForceValue],
  nodeValue: [nodeValue, setNodeValue],
  optionalNodeValue: [optionalNodeValue, setOptionalNodeValue],
}: TArgNode_P): TReactElement | null {
  /* -- STATE -- */

  /**
   * How to handle a node that no longer exists in the selected force.
   * @note **A warning message is displayed upon initialization if the node
   * is not found in the selected force.**
   * @note **Post-initialization, the node is set to the first node in the
   * force's nodes if the node is not found in the selected force.**
   */
  const [handleInvalidRequiredNode, setInvalidRequiredNodeHandler] = useState<
    TRequiredHandleInvalidOption<ClientMissionNode>
  >(() => {
    if (existsInEffectArgs) {
      return {
        method: 'warning',
        message:
          `"${nodeValue.name}" is no longer available in the force selected above. ` +
          `This is likely due to the node being deleted. Please select a valid node, or delete this effect.`,
      }
    } else {
      return {
        method: 'warning',
      }
    }
  })
  /**
   * How to handle a node that no longer exists in the selected force.
   * @note **A warning message is displayed upon initialization if the node
   * is not found in the selected force.**
   * @note **Post-initialization, the node is set to null if the node
   * is not found in the selected force.**
   */
  const [handleInvalidOptionalNode, setInvalidOptionalNodeHandler] = useState<
    TOptionalHandleInvalidOption<ClientMissionNode | null>
  >(() => {
    if (existsInEffectArgs) {
      return {
        method: 'warning',
        message:
          `"${optionalNodeValue?.name}" is no longer available in the force selected above. ` +
          `This is likely due to the node being deleted. Please select a valid node, or delete this effect.`,
      }
    } else {
      return {
        method: 'warning',
      }
    }
  })

  /* -- COMPUTED -- */

  /**
   * Determines if the method for handling an invalid node should
   * be set to the first node in the list or not.
   * @note **The first node should be selected if a previously selected node
   * is no longer available in the force selected above.**
   */
  const selectFirstNode: boolean = compute(() => {
    if (
      isRequired &&
      nodeIsActive &&
      !forceValue.nodes.includes(nodeValue) &&
      handleInvalidRequiredNode.method === 'warning'
    ) {
      return true
    }

    return false
  })

  /**
   * Determines if the node value should be set to the default value
   * in the effect's arguments.
   */
  const selectDefaultNode: boolean = compute(() => {
    if (
      isOptional &&
      nodeIsActive &&
      optionalForceValue !== null &&
      optionalNodeValue !== null &&
      !optionalForceValue.nodes.includes(optionalNodeValue) &&
      handleInvalidRequiredNode.method === 'warning'
    ) {
      return true
    }

    return false
  })

  /**
   * The list of nodes to display in the dropdown.
   */
  const nodes: ClientMissionNode[] = compute(() => {
    if (isOptional) {
      return optionalForceValue ? optionalForceValue.nodes : []
    }
    return forceValue.nodes
  })

  /**
   * The tooltip description to display for a node argument.
   */
  const nodeTooltip: string = compute(() => {
    if (type === 'node' && tooltipDescription) {
      return tooltipDescription
    }

    return ''
  })

  /**
   * The label to display for a node dropdown.
   */
  const label: string = compute(() => (type === 'node' ? name : 'Node'))

  /* -- EFFECTS -- */

  // Determines what to do with the selected node if a different
  // force is selected.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the force's value in the state changes and the first node
    // should be selected, then set the node's value to the first node
    // of the force selected above.
    if (selectFirstNode) {
      setInvalidRequiredNodeHandler({
        method: 'setToFirst',
      })
    }

    // If the force's value in the state changes and the default node
    // should be selected, then set the node's value to null.
    if (selectDefaultNode) {
      setInvalidOptionalNodeHandler({
        method: 'setToDefault',
        defaultValue: null,
      })
    }
  }, [forceValue, optionalForceValue])

  /* -- RENDER -- */

  if (!nodeIsActive || nodes.length === 0) return null

  if (isRequired) {
    return (
      <DetailDropdown<ClientMissionNode>
        fieldType={'required'}
        label={label}
        options={nodes}
        value={nodeValue}
        setValue={setNodeValue}
        tooltipDescription={nodeTooltip}
        isExpanded={false}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={handleInvalidRequiredNode}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionNode>
        fieldType={'optional'}
        label={label}
        options={nodes}
        value={optionalNodeValue}
        setValue={setOptionalNodeValue}
        tooltipDescription={nodeTooltip}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={handleInvalidOptionalNode}
        emptyText='Select a node'
      />
    )
  }
}

/* ---------------------------- TYPES FOR NODE ARG ---------------------------- */

/**
 * The props for the `ArgNode` component.
 */
type TArgNode_P = {
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  existsInEffectArgs: boolean
  /**
   * Determines if the node should be present in the effect's arguments
   * and if the node dropdown should be displayed.
   */
  nodeIsActive: boolean
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
}
