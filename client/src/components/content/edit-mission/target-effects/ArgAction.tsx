import { useEffect, useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import ActionArg, {
  TActionArg,
} from '../../../../../../shared/target-environments/args/action-arg'
import ForceArg from '../../../../../../shared/target-environments/args/force-arg'
import NodeArg from '../../../../../../shared/target-environments/args/node-arg'
import {
  DetailDropdown,
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from '../../form/DetailDropdown'

/**
 * Renders three dropdowns for the argument whose type is `"action"`.
 * @note The first dropdown is for the force, the second dropdown is for the node,
 * and the third dropdown is for the action.
 */
export default function ArgAction({
  effect,
  effect: { mission },
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TActionArgEntry_P): JSX.Element | null {
  /* -- STATE -- */

  // Force
  const [defaultForce] = useState<ClientMissionForce>(effect.force)
  const [forceId] = useState<string>(ForceArg.FORCE_ID_KEY)
  const [forceName] = useState<string>(ForceArg.FORCE_NAME_KEY)
  const [forceValue, setForceValue] = useState<ClientMissionForce>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (arg.required && effectArgs[arg._id]) {
      // Search for the force in the mission.
      let force = mission.getForce(effectArgs[arg._id][forceId])
      // If the force is found then return the force.
      if (force) return force
      // If the force is not found, but the effect's arguments
      // contains the force's ID and name then return a force
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (
        force === undefined &&
        effectArgs[arg._id][forceId] !== undefined &&
        effectArgs[arg._id][forceName] !== undefined
      ) {
        return new ClientMissionForce(mission, {
          _id: effectArgs[arg._id][forceId],
          name: effectArgs[arg._id][forceName],
        })
      }

      // Otherwise, return the default force.
      return defaultForce
    }
    // Otherwise, return the default force.
    else {
      return defaultForce
    }
  })
  const [optionalForceValue, setOptionalForceValue] =
    useState<ClientMissionForce | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (!arg.required && effectArgs[arg._id]) {
        // Search for the force in the mission.
        let force = mission.getForce(effectArgs[arg._id][forceId])
        // If the force is found then return the force.
        if (force) return force
        // If the force is not found, but the effect's arguments
        // contains the force's ID and name then return a force
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (
          force === undefined &&
          effectArgs[arg._id][forceId] !== undefined &&
          effectArgs[arg._id][forceName] !== undefined
        ) {
          return new ClientMissionForce(mission, {
            _id: effectArgs[arg._id][forceId],
            name: effectArgs[arg._id][forceName],
          })
        }

        // Otherwise, return null.
        return null
      }
      // Otherwise, return null.
      else {
        return null
      }
    })

  // Node
  const [defaultNode] = useState<ClientMissionNode>(effect.node)
  const [nodeId] = useState<string>(NodeArg.NODE_ID_KEY)
  const [nodeName] = useState<string>(NodeArg.NODE_NAME_KEY)
  const [nodeValue, setNodeValue] = useState<ClientMissionNode>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (arg.required && effectArgs[arg._id]) {
      // Search for the node in the mission.
      let node = mission.getNode(effectArgs[arg._id][nodeId])
      // If the node is found then return the node.
      if (node) return node
      // If the node is not found, but the effect's arguments
      // contains the node's ID and name then return a node
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (
        node === undefined &&
        effectArgs[arg._id][nodeId] !== undefined &&
        effectArgs[arg._id][nodeName] !== undefined
      ) {
        return new ClientMissionNode(forceValue, {
          _id: effectArgs[arg._id][nodeId],
          name: effectArgs[arg._id][nodeName],
          prototypeId: mission.prototypes[0]._id,
        })
      }
      // Otherwise, return the default node.
      return defaultNode
    }
    // Otherwise, return the default node.
    else {
      return defaultNode
    }
  })
  const [optionalNodeValue, setOptionalNodeValue] =
    useState<ClientMissionNode | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (!arg.required && effectArgs[arg._id]) {
        // Search for the node in the mission.
        let node = mission.getNode(effectArgs[arg._id][nodeId])
        // If the node is found then return the node.
        if (node) return node
        // If the node is not found, but the effect's arguments
        // contains the node's ID and name then return a node
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (
          optionalForceValue &&
          node === undefined &&
          effectArgs[arg._id][nodeId] !== undefined &&
          effectArgs[arg._id][nodeName] !== undefined
        ) {
          return new ClientMissionNode(optionalForceValue, {
            _id: effectArgs[arg._id][nodeId],
            name: effectArgs[arg._id][nodeName],
            prototypeId: mission.prototypes[0]._id,
          })
        }
        // Otherwise, return null.
        return null
      }
      // Otherwise, return null.
      else {
        return null
      }
    })
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
    if (effectArgs[arg._id]) {
      return {
        method: 'warning',
        message:
          `"${
            effectArgs[arg._id][nodeName]
          }" is no longer available in the force selected above. ` +
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
    if (effectArgs[arg._id]) {
      return {
        method: 'warning',
        message:
          `"${
            effectArgs[arg._id][nodeName]
          }" is no longer available in the force selected above. ` +
          `This is likely due to the node being deleted. Please select a valid node, or delete this effect.`,
      }
    } else {
      return {
        method: 'warning',
      }
    }
  })

  // Action
  const [defaultAction] = useState<ClientMissionAction>(effect.action)
  const [actionId] = useState<string>(ActionArg.ACTION_ID_KEY)
  const [actionName] = useState<string>(ActionArg.ACTION_NAME_KEY)
  const [actionValue, setActionValue] = useState<ClientMissionAction>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (arg.required && effectArgs[arg._id]) {
      // Search for the action in the mission.
      let action = mission.getAction(effectArgs[arg._id][actionId])
      // If the action is found then return the action.
      if (action) return action
      // If the action is not found, but the effect's arguments
      // contains the action's ID and name then return an action
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (
        action === undefined &&
        effectArgs[arg._id][actionId] !== undefined &&
        effectArgs[arg._id][actionName] !== undefined
      ) {
        return new ClientMissionAction(nodeValue, {
          _id: effectArgs[arg._id][actionId],
          name: effectArgs[arg._id][actionName],
        })
      }
      // Otherwise, return the default action.
      return defaultAction
    }
    // Otherwise, return the default action.
    else {
      return defaultAction
    }
  })
  const [optionalActionValue, setOptionalActionValue] =
    useState<ClientMissionAction | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (!arg.required && effectArgs[arg._id]) {
        // Search for the action in the mission.
        let action = mission.getAction(effectArgs[arg._id][actionId])
        // If the action is found then return the action.
        if (action) return action
        // If the action is not found, but the effect's arguments
        // contains the action's ID and name then return an action
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (
          optionalNodeValue &&
          action === undefined &&
          effectArgs[arg._id][actionId] !== undefined &&
          effectArgs[arg._id][actionName] !== undefined
        ) {
          return new ClientMissionAction(optionalNodeValue, {
            _id: effectArgs[arg._id][actionId],
            name: effectArgs[arg._id][actionName],
          })
        }
        // Otherwise, return null.
        return null
      }
      // Otherwise, return null.
      else {
        return null
      }
    })
  /**
   * How to handle an action that no longer exists in the selected node.
   * @note **A warning message is displayed upon initialization if the action
   * is not found in the selected node.**
   * @note **Post-initialization, the action is set to the first action in the
   * node's actions if the action is not found in the selected node.**
   */
  const [handleInvalidRequiredAction, setInvalidRequiredActionHandler] =
    useState<TRequiredHandleInvalidOption<ClientMissionAction>>(() => {
      if (effectArgs[arg._id]) {
        return {
          method: 'warning',
          message:
            `"${
              effectArgs[arg._id][actionName]
            }" is no longer available in the node selected above. ` +
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
      if (effectArgs[arg._id]) {
        return {
          method: 'warning',
          message:
            `"${
              effectArgs[arg._id][actionName]
            }" is no longer available in the node selected above. ` +
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
   * Determines if the argument is required.
   */
  const isRequired: boolean = compute(() => arg.required)

  /**
   * Determines if the argument is optional.
   */
  const isOptional: boolean = compute(() => !arg.required)

  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  const existsInEffectArgs: boolean = compute(
    () => effectArgs[arg._id] !== undefined,
  )

  /**
   * The list of forces to display in the dropdown.
   */
  const forces: ClientMissionForce[] = compute(() => mission.forces)

  /**
   * The list of nodes to display in the dropdown.
   */
  const nodes: ClientMissionNode[] = compute(() => {
    if (isOptional) {
      return optionalForceValue
        ? optionalForceValue.nodes.filter((node) => node.executable)
        : []
    }
    return forceValue.nodes.filter((node) => node.executable)
  })

  /**
   * The list of actions to display in the dropdown.
   */
  const actions: ClientMissionAction[] = compute(() => {
    if (isOptional) return Array.from(optionalNodeValue?.actions.values() ?? [])
    return Array.from(nodeValue.actions.values())
  })

  /**
   * The warning message to display when the force is no longer available in the mission.
   */
  const forceWarningMessage: string = compute(() => {
    if (existsInEffectArgs) {
      return (
        `"${
          effectArgs[arg._id][forceName]
        }" is no longer available in the mission. ` +
        `This is likely due to the force being deleted. Please select a valid force, or delete this effect.`
      )
    } else {
      return ''
    }
  })

  /**
   * Determines if the force value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertForce: boolean = compute(() => {
    // If the argument is required then add the force value
    // to the effect's arguments.
    if (isRequired) return true

    // If the argument is optional and a force has been selected
    // then upsert the force to the effect's arguments.
    if (isOptional && optionalForceValue !== null) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the force value should be removed from the
   * effect's arguments.
   */
  const removeForce: boolean = compute(() => {
    // If the argument is optional, a force hasn't been selected,
    // yet the argument exists in the effect's arguments then remove
    // the force value from the effect's arguments.
    if (isOptional && optionalForceValue === null && existsInEffectArgs) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the method for handling an invalid node should
   * be set to the first node in the list or not.
   * @note **The first node should be selected if a previously selected node
   * is no longer available in the force selected above.**
   */
  const selectFirstNode: boolean = compute(() => {
    if (
      isRequired &&
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
   * Determines if the node value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertNode: boolean = compute(() => {
    // If the argument is required and the node exists in the
    // force's nodes then upsert the node to the effect's arguments.
    if (isRequired && forceValue.nodes.includes(nodeValue)) {
      return true
    }

    // If the argument is optional, a force has been selected,
    // a node has been selected, and the node exists in the
    // force's nodes then upsert the node to the effect's arguments.
    if (
      isOptional &&
      optionalForceValue !== null &&
      optionalNodeValue !== null &&
      optionalForceValue.nodes.includes(optionalNodeValue)
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the node value should be removed from the
   * effect's arguments.
   */
  const removeNode: boolean = compute(() => {
    // If the argument is optional, a force has been selected,
    // a node hasn't been selected, yet the argument exists
    // in the effect's arguments then remove the node value
    // from the effect's arguments.
    if (
      isOptional &&
      optionalForceValue !== null &&
      optionalNodeValue === null &&
      existsInEffectArgs
    ) {
      return true
    }

    // Otherwise, return false.
    return false
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
   * Determines if the action value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertAction: boolean = compute(() => {
    // If the argument is required and the node exists in the
    // force's nodes and the action exists in the node's actions
    // then upsert the action to the effect's arguments.
    if (
      isRequired &&
      forceValue.nodes.includes(nodeValue) &&
      nodeValue.actions.has(actionValue._id)
    ) {
      return true
    }

    // If the argument is optional, a force has been selected,
    // a node has been selected, and the action exists in the
    // node's actions then upsert the action to the effect's arguments.
    if (
      isOptional &&
      optionalForceValue !== null &&
      optionalNodeValue !== null &&
      optionalActionValue !== null &&
      optionalForceValue.nodes.includes(optionalNodeValue) &&
      optionalNodeValue.actions.has(optionalActionValue._id)
    ) {
      return true
    }

    // Otherwise, return false.
    return true
  })

  /**
   * Determines if the action value should be removed from the
   * effect's arguments.
   */
  const removeAction: boolean = compute(() => {
    // If the argument is optional, a force has been selected,
    // a node has been selected, an action hasn't been selected,
    // yet the argument exists in the effect's arguments then
    // remove the action value from the effect's arguments.
    if (
      isOptional &&
      optionalForceValue !== null &&
      optionalNodeValue !== null &&
      optionalForceValue.nodes.includes(optionalNodeValue) &&
      optionalActionValue === null &&
      existsInEffectArgs
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

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

  // Update the argument's value in the effect's arguments
  // when any of the required argument's values in the state changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    if (upsertForce || upsertNode || upsertAction) {
      upsert({ force: forceValue, node: nodeValue, action: actionValue })
    }
  }, [forceValue, nodeValue, actionValue])

  // Update the argument's value in the effect's arguments
  // when any of the optional argument's values in the state changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    if (upsertForce || upsertNode || upsertAction) {
      upsert({
        force: optionalForceValue,
        node: optionalNodeValue,
        action: optionalActionValue,
      })
    }

    if (removeForce || removeNode || removeAction) {
      remove(optionalForceValue, optionalNodeValue, optionalActionValue)
    }
  }, [optionalForceValue, optionalNodeValue, optionalActionValue])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required, then set the argument's
    // values to their default values.
    // *** Note: A default value is mandatory if the
    // *** argument is required.
    if (arg.required) {
      // If the force value stored in the state is the
      // same as the default force value, then manually
      // update the effect's arguments by adding this argument
      // and its value.
      if (forceValue === defaultForce) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert({ force: forceValue })
      }
      // Otherwise, set the force value to the default force value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        upsert({ force: defaultForce })
      }

      // If the node value stored in the state is the
      // same as the default node value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (nodeValue === defaultNode) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert({ node: nodeValue })
      }
      // Otherwise, set the node value to the default node value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        upsert({ node: defaultNode })
      }

      // If the action value stored in the state is the
      // same as the default action value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (actionValue === defaultAction) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert({ action: actionValue })
      }
      // Otherwise, set the action value to the default action value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        upsert({ action: defaultAction })
      }
    }
  }

  /**
   * Updates or inserts the provided argument(s) into the effect's arguments.
   * @param stateValues The argument values to insert or update.
   * @param stateValues.force The force value to insert or update.
   * @param stateValues.node The node value to insert or update.
   * @param stateValues.action The action value to insert or update.
   */
  const upsert = (stateValues: {
    force?: ClientMissionForce | null
    node?: ClientMissionNode | null
    action?: ClientMissionAction | null
  }) => {
    const { force, node, action } = stateValues
    let data: ClientEffect['args'] = {}

    if (force) {
      data = {
        forceId: force._id,
        forceName: force.name,
      }
    }

    if (node) {
      data = {
        ...data,
        nodeId: node._id,
        nodeName: node.name,
      }
    }

    if (action) {
      data = {
        ...data,
        actionId: action._id,
        actionName: action.name,
      }
    }

    setEffectArgs((prev) => ({
      ...prev,
      [arg._id]: {
        ...prev[arg._id],
        ...data,
      },
    }))
  }

  /**
   * Removes the argument from the effect's arguments.
   * @param forceValue The force value to remove.
   * @param nodeValue The node value to remove.
   * @param actionValue The action value to remove.
   * @note An argument that is required should never be removed
   * from the effect's arguments.
   */
  const remove = (
    forceValue: ClientMissionForce | null,
    nodeValue: ClientMissionNode | null,
    actionValue: ClientMissionAction | null,
  ) => {
    setEffectArgs((prev) => {
      if (!forceValue) {
        delete prev[arg._id][forceId]
        delete prev[arg._id][forceName]
      }
      if (!nodeValue) {
        delete prev[arg._id][nodeId]
        delete prev[arg._id][nodeName]
      }
      if (!actionValue) {
        delete prev[arg._id][actionId]
        delete prev[arg._id][actionName]
      }

      // If the argument is empty, then remove the argument
      // from the effect's arguments.
      if (
        Object.keys(prev[arg._id]).length === 0 &&
        prev[arg._id][forceId] === undefined &&
        prev[arg._id][nodeId] === undefined &&
        prev[arg._id][actionId] === undefined
      ) {
        delete prev[arg._id]
      }

      return prev
    })
  }

  /* -- RENDER -- */

  if (isRequired) {
    return (
      <>
        <DetailDropdown<ClientMissionForce>
          fieldType={'required'}
          label={'Force'}
          options={forces}
          stateValue={forceValue}
          setState={setForceValue}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
            message: forceWarningMessage,
          }}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_required`}
        />
        <DetailDropdown<ClientMissionNode>
          fieldType={'required'}
          label={arg.name}
          options={nodes}
          stateValue={nodeValue}
          setState={setNodeValue}
          tooltipDescription='Only nodes that have actions (executable) are displayed.'
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={(option) => option.name}
          handleInvalidOption={handleInvalidRequiredNode}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_node_required`}
        />
        <DetailDropdown<ClientMissionAction>
          fieldType={'required'}
          label={arg.name}
          options={actions}
          stateValue={actionValue}
          setState={setActionValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          getKey={({ _id }) => _id}
          render={(option) => option.name}
          handleInvalidOption={handleInvalidRequiredAction}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_action_required`}
        />
      </>
    )
  } else {
    return (
      <>
        <DetailDropdown<ClientMissionForce>
          fieldType={'optional'}
          label={'Force'}
          options={forces}
          stateValue={optionalForceValue}
          setState={setOptionalForceValue}
          isExpanded={false}
          render={(option) => option?.name}
          getKey={(option) => option?._id}
          handleInvalidOption={{
            method: 'warning',
            message: forceWarningMessage,
          }}
          emptyText='Select a force'
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_optional`}
        />
        <DetailDropdown<ClientMissionNode>
          fieldType={'optional'}
          label={'Node'}
          options={nodes}
          stateValue={optionalNodeValue}
          setState={setOptionalNodeValue}
          tooltipDescription='Only nodes that have actions (executable) are displayed.'
          isExpanded={false}
          render={(option) => option?.name}
          getKey={(option) => option?._id}
          handleInvalidOption={handleInvalidOptionalNode}
          emptyText='Select a node'
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_node_optional`}
        />
        <DetailDropdown<ClientMissionAction>
          fieldType={'optional'}
          label={arg.name}
          options={actions}
          stateValue={optionalActionValue}
          setState={setOptionalActionValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          render={(option) => option?.name}
          getKey={(option) => option?._id}
          handleInvalidOption={handleInvalidOptionalAction}
          emptyText='All actions'
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_action_optional`}
        />
      </>
    )
  }
}

/* ---------------------------- TYPES FOR ACTION ARG ENTRY ---------------------------- */

/**
 * The props for the `ActionArgEntry` component.
 */
type TActionArgEntry_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The action argument to render.
   */
  arg: TActionArg
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: TReactSetter<ClientEffect['args']>
}
