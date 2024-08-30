import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { usePostInitEffect } from 'src/toolbox/hooks'
import ForceArg from '../../../../../../shared/target-environments/args/force-arg'
import NodeArg, {
  TNodeArg,
} from '../../../../../../shared/target-environments/args/node-arg'
import {
  DetailDropdown,
  TRequiredHandleInvalidOption,
} from '../../form/DetailDropdown'

/**
 * Renders two dropdowns for the argument whose type is `"node"`.
 * @note The first dropdown is for the force, and the second dropdown is for the node.
 */
export default function ArgNode({
  effect,
  effect: { mission },
  arg,
  initialize,
  effectArgs,
  setEffectArgs,
}: TNodeArgEntry_P): JSX.Element | null {
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
          structureKey: mission.prototypes[0]._id,
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
            structureKey: mission.prototypes[0]._id,
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
   */
  const [handleInvalidNodeOption, setHandleInvalidNodeOption] = useState<
    TRequiredHandleInvalidOption<ClientMissionNode>
  >({
    method: 'warning',
    message: 'This node no longer exists in the force selected above.',
  })

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument is required...
    if (arg.required) {
      // ...update the required value in the effect's arguments.
      setEffectArgs((prev) => ({
        ...prev,
        [arg._id]: {
          forceId: forceValue._id,
          forceName: forceValue.name,
        },
      }))

      // If the node value is in the force's nodes then update
      // the node value in the effect's arguments.
      if (forceValue.nodes.includes(nodeValue)) {
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: forceValue._id,
            forceName: forceValue.name,
            nodeId: nodeValue._id,
            nodeName: nodeValue.name,
          },
        }))
      }
      // Or, if the node value is not in the force's nodes and
      // the invalid node option method is set to "warning" then
      // set the node value to the first node in the force's nodes.
      else if (
        !forceValue.nodes.includes(nodeValue) &&
        handleInvalidNodeOption.method === 'warning'
      ) {
        setHandleInvalidNodeOption({
          method: 'setToFirst',
        })
      }
    }
    // Or, if the argument is optional...
    else {
      // ...and the optional force value is null...
      if (optionalForceValue === null) {
        // ...and the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        if (effectArgs[arg._id] !== undefined) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
      // Or, if the optional force value is not null...
      else {
        // ...then update the force value in the effect's arguments.
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: optionalForceValue._id,
            forceName: optionalForceValue.name,
          },
        }))

        // If the optional node value is not null and the node
        // value is in the force's nodes then update the node
        // value in the effect's arguments
        if (
          optionalNodeValue !== null &&
          optionalForceValue.nodes.includes(optionalNodeValue)
        ) {
          setEffectArgs((prev) => ({
            ...prev,
            [arg._id]: {
              forceId: optionalForceValue._id,
              forceName: optionalForceValue.name,
              nodeId: optionalNodeValue._id,
              nodeName: optionalNodeValue.name,
            },
          }))
        }
        // Or, if the optional node value is not null and the
        // optional node value is not in the force's nodes and
        // the invalid node option method is set to "warning"
        // then set the node value to the first node in the
        // force's nodes.
        else if (
          optionalNodeValue !== null &&
          !optionalForceValue.nodes.includes(optionalNodeValue) &&
          handleInvalidNodeOption.method === 'warning'
        ) {
          setHandleInvalidNodeOption({
            method: 'setToFirst',
          })
        }
        // Or, if the optional node value is null and the argument
        // is in the effect's arguments then remove the argument
        // from the effect's arguments.
        else if (
          optionalNodeValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
  }, [nodeValue, optionalNodeValue, forceValue, optionalForceValue])

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
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: forceValue._id,
            forceName: forceValue.name,
          },
        }))
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
        setEffectArgs((prev) => ({
          ...prev,
          [arg._id]: {
            forceId: forceValue._id,
            forceName: forceValue.name,
            nodeId: nodeValue._id,
            nodeName: nodeValue.name,
          },
        }))
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
    }
  }

  /* -- RENDER -- */

  if (arg.required) {
    return (
      <>
        <DetailDropdown<ClientMissionForce>
          fieldType={'required'}
          label={'Force'}
          options={mission.forces}
          stateValue={forceValue}
          setState={setForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          getKey={({ _id }) => _id}
          render={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
            message: 'This force no longer exists in the mission.',
          }}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_required`}
        />
        <DetailDropdown<ClientMissionNode>
          fieldType={'required'}
          label={arg.name}
          options={forceValue.nodes}
          stateValue={nodeValue}
          setState={setNodeValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          getKey={({ _id }) => _id}
          render={(option) => option.name}
          handleInvalidOption={handleInvalidNodeOption}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_node_required`}
        />
      </>
    )
  } else {
    return (
      <>
        <DetailDropdown<ClientMissionForce | null>
          fieldType={'optional'}
          label={'Force'}
          options={mission.forces}
          stateValue={optionalForceValue}
          setState={setOptionalForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          render={(option) => option.name}
          getKey={({ _id }) => _id}
          handleInvalidOption={{
            method: 'warning',
            message: 'This force no longer exists in the mission.',
          }}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_force_optional`}
        />
        <DetailDropdown<ClientMissionNode | null>
          fieldType={'optional'}
          label={arg.name}
          options={optionalForceValue ? optionalForceValue.nodes : []}
          stateValue={optionalNodeValue}
          setState={setOptionalNodeValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          render={(option) => option.name}
          getKey={({ _id }) => _id}
          handleInvalidOption={handleInvalidNodeOption}
          key={`arg-${arg._id}_name-${arg.name}_type-${arg.type}_node_optional`}
        />
      </>
    )
  }
}

/* ---------------------------- TYPES FOR NODE ARG ENTRY ---------------------------- */

/**
 * The props for the `NodeArgEntry` component.
 */
type TNodeArgEntry_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The node argument to render.
   */
  arg: TNodeArg
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
