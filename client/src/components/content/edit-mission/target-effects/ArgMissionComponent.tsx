import { useEffect, useState } from 'react'
import ClientMissionAction from 'src/missions/actions'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { TMissionComponentArg } from '../../../../../../shared/target-environments/args'
import ActionArg from '../../../../../../shared/target-environments/args/action-arg'
import ForceArg from '../../../../../../shared/target-environments/args/force-arg'
import NodeArg from '../../../../../../shared/target-environments/args/node-arg'
import {
  DetailDropdown,
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from '../../form/DetailDropdown'

/**
 * Renders dropdowns for the argument whose type is `"mission-component"`.
 */
export default function ArgMissionComponent({
  effect,
  effect: { mission },
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TArgMissionComponent_P): JSX.Element | null {
  /* -- CONSTANTS -- */
  /**
   * Determines if the argument is required.
   */
  const isRequired: boolean = arg.required
  /**
   * Determines if the argument is optional.
   */
  const isOptional: boolean = !arg.required
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  const existsInEffectArgs: boolean = effectArgs[arg._id] !== undefined

  /* -- STATE -- */

  /* -- force -- */
  const [defaultForce] = useState<ClientMissionForce>(effect.force)
  const [forceId] = useState<string>(ForceArg.FORCE_ID_KEY)
  const [forceName] = useState<string>(ForceArg.FORCE_NAME_KEY)
  const [forceValue, setForceValue] = useState<ClientMissionForce>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the force in the mission.
      let forceInMission = effect.getForceFromArgs(arg._id)
      // If the force is found then return the force.
      if (forceInMission) return forceInMission
      let forceInArgs = effect.getForceDataInArgs(arg._id)
      // If the force is not found, but the effect's arguments
      // contains the force's ID and name then return a force
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (!forceInMission && forceInArgs) {
        return new ClientMissionForce(mission, {
          _id: forceInArgs._id,
          name: forceInArgs.name,
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
      if (isOptional && existsInEffectArgs) {
        // Search for the force in the mission.
        let forceInMission = effect.getForceFromArgs(arg._id)
        // If the force is found then return the force.
        if (forceInMission) return forceInMission
        let forceInArgs = effect.getForceDataInArgs(arg._id)
        // If the force is not found, but the effect's arguments
        // contains the force's ID and name then return a force
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (!forceInMission && forceInArgs) {
          return new ClientMissionForce(mission, {
            _id: forceInArgs._id,
            name: forceInArgs.name,
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

  /** -- node -- */
  const [defaultNode] = useState<ClientMissionNode>(effect.node)
  const [nodeId] = useState<string>(NodeArg.NODE_ID_KEY)
  const [nodeName] = useState<string>(NodeArg.NODE_NAME_KEY)
  const [nodeValue, setNodeValue] = useState<ClientMissionNode>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the node in the mission.
      let nodeInMission = effect.getNodeFromArgs(arg._id)
      // If the node is found then return the node.
      if (nodeInMission) return nodeInMission
      let nodeInArgs = effect.getNodeDataInArgs(arg._id)
      // If the node is not found, but the effect's arguments
      // contains the node's ID and name then return a node
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (!nodeInMission && nodeInArgs) {
        return new ClientMissionNode(forceValue, {
          _id: nodeInArgs._id,
          name: nodeInArgs.name,
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
      if (isOptional && existsInEffectArgs) {
        // Search for the node in the mission.
        let nodeInMission = effect.getNodeFromArgs(arg._id)
        // If the node is found then return the node.
        if (nodeInMission) return nodeInMission
        let nodeInArgs = effect.getNodeDataInArgs(arg._id)
        // If the node is not found, but the effect's arguments
        // contains the node's ID and name then return a node
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (optionalForceValue && !nodeInMission && nodeInArgs) {
          return new ClientMissionNode(optionalForceValue, {
            _id: nodeInArgs._id,
            name: nodeInArgs.name,
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
    if (existsInEffectArgs) {
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
    if (existsInEffectArgs) {
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

  /* -- action -- */
  const [defaultAction] = useState<ClientMissionAction>(effect.action)
  const [actionId] = useState<string>(ActionArg.ACTION_ID_KEY)
  const [actionName] = useState<string>(ActionArg.ACTION_NAME_KEY)
  const [actionValue, setActionValue] = useState<ClientMissionAction>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the action in the mission.
      let actionInMission = effect.getActionFromArgs(arg._id)
      // If the action is found then return the action.
      if (actionInMission) return actionInMission
      let actionInArgs = effect.getActionDataInArgs(arg._id)
      // If the action is not found, but the effect's arguments
      // contains the action's ID and name then return an action
      // object using the ID and name from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (!actionInMission && actionInArgs) {
        return new ClientMissionAction(nodeValue, {
          _id: actionInArgs._id,
          name: actionInArgs.name,
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
      if (isOptional && existsInEffectArgs) {
        // Search for the action in the mission.
        let actionInMission = effect.getActionFromArgs(arg._id)
        // If the action is found then return the action.
        if (actionInMission) return actionInMission
        let actionInArgs = effect.getActionDataInArgs(arg._id)
        // If the action is not found, but the effect's arguments
        // contains the action's ID and name then return an action
        // object using the ID and name from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (optionalNodeValue && !actionInMission && actionInArgs) {
          return new ClientMissionAction(optionalNodeValue, {
            _id: actionInArgs._id,
            name: actionInArgs.name,
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
      if (existsInEffectArgs) {
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
      if (existsInEffectArgs) {
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

  /* -- force -- */

  /**
   * The list of forces to display in the dropdown.
   */
  const forces: ClientMissionForce[] = compute(() => mission.forces)

  /**
   * Determines if the force should be present in the effect's arguments
   * and if the force dropdown should be displayed.
   */
  const forceIsActive: boolean = compute(
    () => arg.type === 'force' || arg.type === 'node' || arg.type === 'action',
  )

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
    if (!forceIsActive) return false

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
    if (!forceIsActive) return true

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
   * The tooltip description to display for a force argument.
   */
  const forceTooltip: string = compute(() => {
    if (arg.type === 'force' && arg.tooltipDescription) {
      return arg.tooltipDescription
    }

    return ''
  })

  /* -- node -- */

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
   * Determines if the node should be present in the effect's arguments
   * and if the node dropdown should be displayed.
   */
  const nodeIsActive: boolean = compute(
    () => arg.type === 'node' || arg.type === 'action',
  )

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
   * Determines if the node value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertNode: boolean = compute(() => {
    if (!nodeIsActive) return false

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
    if (!nodeIsActive) return true

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
   * The tooltip description to display for a node argument.
   */
  const nodeTooltip: string = compute(() => {
    if (arg.type === 'node' && arg.tooltipDescription) {
      return arg.tooltipDescription
    }

    if (arg.type === 'action') {
      return 'Only nodes that have actions (executable) are displayed.'
    }

    return ''
  })

  /** -- action -- */

  /**
   * The list of actions to display in the dropdown.
   */
  const actions: ClientMissionAction[] = compute(() => {
    if (isOptional) return Array.from(optionalNodeValue?.actions.values() ?? [])
    return Array.from(nodeValue.actions.values())
  })

  /**
   * Determines if the action should be present in the effect's arguments
   * and if the action dropdown should be displayed.
   */
  const actionIsActive: boolean = compute(() => arg.type === 'action')

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
   * Determines if the action value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertAction: boolean = compute(() => {
    if (!actionIsActive) return false

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
    return false
  })

  /**
   * Determines if the action value should be removed from the
   * effect's arguments.
   */
  const removeAction: boolean = compute(() => {
    if (!actionIsActive) return true

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

  /**
   * The tooltip description to display for an action argument.
   */
  const actionTooltip: string = compute(() => {
    if (arg.type === 'action' && arg.tooltipDescription) {
      return arg.tooltipDescription
    }
    return ''
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
    upsert()
    remove()
  }, [
    forceValue,
    nodeValue,
    actionValue,
    optionalForceValue,
    optionalNodeValue,
    optionalActionValue,
  ])

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
    if (isRequired) {
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
        upsert()
      }
      // Otherwise, set the force value to the default force value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setForceValue(defaultForce)
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
        upsert()
      }
      // Otherwise, set the node value to the default node value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setNodeValue(defaultNode)
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
        upsert()
      }
      // Otherwise, set the action value to the default action value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setActionValue(defaultAction)
      }
    }
  }

  /**
   * Updates or inserts the provided argument(s) into the effect's arguments.
   */
  const upsert = () => {
    // Initialize the data.
    let data: ClientEffect['args'] = {}

    // Add the force information to the data, if applicable.
    if (upsertForce) {
      let id = forceValue._id
      let name = forceValue.name

      if (isOptional) {
        // *** Note: The "optionalForceValue" is validated within
        // *** the "upsertForce" computed property.
        id = optionalForceValue!._id
        name = optionalForceValue!.name
      }

      data = {
        forceId: id,
        forceName: name,
      }
    }

    // Add the node information to the data, if applicable.
    if (upsertNode) {
      let id = nodeValue._id
      let name = nodeValue.name

      if (isOptional) {
        // *** Note: The "optionalNodeValue" is validated within
        // *** the "upsertNode" computed property.
        id = optionalNodeValue!._id
        name = optionalNodeValue!.name
      }

      data = {
        ...data,
        nodeId: id,
        nodeName: name,
      }
    }

    // Add the action information to the data, if applicable.
    if (upsertAction) {
      let id = actionValue._id
      let name = actionValue.name

      if (isOptional) {
        // *** Note: The "optionalActionValue" is validated within
        // *** the "upsertAction" computed property.
        id = optionalActionValue!._id
        name = optionalActionValue!.name
      }

      data = {
        ...data,
        actionId: id,
        actionName: name,
      }
    }

    // Update the effect's arguments with the new data.
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
   */
  const remove = () => {
    setEffectArgs((prev) => {
      if (removeForce) {
        delete prev[arg._id][forceId]
        delete prev[arg._id][forceName]
      }
      if (removeNode) {
        delete prev[arg._id][nodeId]
        delete prev[arg._id][nodeName]
      }
      if (removeAction) {
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

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * The JSX element to render for the force dropdown.
   */
  const forceJsx: JSX.Element | null = compute(() => {
    if (!forceIsActive) return null

    if (isRequired) {
      return (
        <DetailDropdown<ClientMissionForce>
          fieldType={'required'}
          label={'Force'}
          options={forces}
          stateValue={forceValue}
          setState={setForceValue}
          tooltipDescription={forceTooltip}
          isExpanded={false}
          getKey={({ _id }) => _id}
          render={({ name }) => name}
          handleInvalidOption={{
            method: 'warning',
            message: forceWarningMessage,
          }}
        />
      )
    } else {
      return (
        <DetailDropdown<ClientMissionForce>
          fieldType={'optional'}
          label={'Force'}
          options={forces}
          stateValue={optionalForceValue}
          setState={setOptionalForceValue}
          tooltipDescription={forceTooltip}
          isExpanded={false}
          render={(option) => option?.name}
          getKey={(option) => option?._id}
          handleInvalidOption={{
            method: 'warning',
            message: forceWarningMessage,
          }}
          emptyText='Select a force'
        />
      )
    }
  })

  /**
   * The JSX element to render for the node dropdown.
   */
  const nodeJsx: JSX.Element | null = compute(() => {
    if (!nodeIsActive) return null

    if (isRequired) {
      return (
        <DetailDropdown<ClientMissionNode>
          fieldType={'required'}
          label={arg.name}
          options={nodes}
          stateValue={nodeValue}
          setState={setNodeValue}
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
          label={'Node'}
          options={nodes}
          stateValue={optionalNodeValue}
          setState={setOptionalNodeValue}
          tooltipDescription={nodeTooltip}
          isExpanded={false}
          render={(option) => option?.name}
          getKey={(option) => option?._id}
          handleInvalidOption={handleInvalidOptionalNode}
          emptyText='Select a node'
        />
      )
    }
  })

  /**
   * The JSX element to render for the action dropdown.
   */
  const actionJsx: JSX.Element | null = compute(() => {
    if (!actionIsActive) return null

    if (isRequired) {
      return (
        <DetailDropdown<ClientMissionAction>
          fieldType={'required'}
          label={arg.name}
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
    } else {
      return (
        <DetailDropdown<ClientMissionAction>
          fieldType={'optional'}
          label={arg.name}
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
  })

  /* -- RENDER -- */

  return (
    <>
      {forceJsx}
      {nodeJsx}
      {actionJsx}
    </>
  )
}

/* ---------------------------- TYPES FOR MISSION COMPONENT ---------------------------- */

/**
 * The props for the `ArgMissionComponent` component.
 */
type TArgMissionComponent_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
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
