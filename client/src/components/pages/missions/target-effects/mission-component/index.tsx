import type { TMetisClientComponents } from '@client/index'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import { MissionResource } from '@shared/missions/MissionResource'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { ActionArg } from '@shared/target-environments/args/mission-component/ActionArg'
import { FileArg } from '@shared/target-environments/args/mission-component/FileArg'
import { ForceArg } from '@shared/target-environments/args/mission-component/ForceArg'
import type {
  TMissionComponentArg,
  TMissionComponentMetadata,
} from '@shared/target-environments/args/mission-component/MissionComponentArg'
import { NodeArg } from '@shared/target-environments/args/mission-component/NodeArg'
import { PoolArg } from '@shared/target-environments/args/mission-component/PoolArg'
import { ResourceArg } from '@shared/target-environments/args/mission-component/ResourceArg'
import type {
  TActionMetadata,
  TFileMetadata,
  TForceMetadata,
  TNodeMetadata,
  TPoolMetadata,
  TResourceMetadata,
} from '@shared/target-environments/types'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect, useState } from 'react'
import ArgAction from './ArgAction'
import ArgFile from './ArgFile'
import ArgForce from './ArgForce'
import ArgNode from './ArgNode'
import ArgPool from './ArgPool'
import ArgResource from './ArgResource'

/**
 * Renders dropdowns for the argument whose type is `"force"`, `"node"`, `"action"`, `"file"`, `"pool"`, or `"resource"`.
 */
export default function ArgMissionComponent({
  effect,
  effect: { mission, sourceForce, sourceNode, sourceAction },
  arg,
  arg: { _id, type, required },
  initialize,
  effectArgs,
  setEffectArgs,
}: TArgMissionComponent_P): TReactElement | null {
  /* -- CONSTANTS -- */

  const isRequired: boolean = required
  const isOptional: boolean = !required
  const existsInEffectArgs: boolean = effectArgs[_id] !== undefined

  // Metadata keys used in the effect.args for
  // the mission component argument types.
  const forceKey = ForceArg.FORCE_KEY
  const forceName = ForceArg.FORCE_NAME
  const nodeKey = NodeArg.NODE_KEY
  const nodeName = NodeArg.NODE_NAME
  const actionKey = ActionArg.ACTION_KEY
  const actionName = ActionArg.ACTION_NAME
  const fileId = FileArg.FILE_ID
  const fileName = FileArg.FILE_NAME
  const poolKey = PoolArg.POOL_KEY
  const poolName = PoolArg.POOL_NAME
  const resourceId = ResourceArg.RESOURCE_ID
  const resourceName = ResourceArg.RESOURCE_NAME

  /* -- STATE -- */

  /* -- DEFAULT STATE VALUES -- */

  const [defaultAction] = useState<ClientMissionAction>(
    (): ClientMissionAction => {
      // First, default to the action associated with
      // the effect itself, if possible. Then, as a back
      // up, use the first action available in the mission.
      // If that's still not an option, create a detached
      // action as a placeholder.
      if (effect.sourceAction) {
        return effect.sourceAction
      } else if (mission.allActions.length) {
        return mission.allActions[0]
      } else {
        return ClientMissionAction.createDetached(
          StringToolbox.generateRandomId(),
          'No actions available.',
          effect.sourceNode ? effect.sourceNode : mission.allNodes[0],
        )
      }
    },
  )

  const [defaultNode] = useState<ClientMissionNode>(() => {
    // First, default to the node associated with
    // the effect itself, if possible. Then, as a back
    // up, use the the node of the default action, if the
    // arg type is 'action'. Then, use the first node available
    // in the mission. If that's still not an option, throw an error
    // because a mission should always have at least one node.
    if (effect.sourceNode) {
      return effect.sourceNode
    } else if (type === 'action') {
      return defaultAction.node
    } else if (mission.allNodes.length) {
      return mission.allNodes[0]
    } else {
      throw new Error(
        'No valid node found. A mission must have at least one node.',
      )
    }
  })

  const [defaultPool] = useState<ResourcePool<TMetisClientComponents>>(() => {
    let firstPool = mission.forces[0]?.resourcePools[0]

    if (firstPool) {
      return firstPool
    } else {
      throw new Error(
        'No valid pool found. A mission must have at least one pool.',
      )
    }
  })
  const [defaultForce] = useState<ClientMissionForce>(
    (): ClientMissionForce => {
      // First, default to the force associated with
      // the effect itself, if possible. Then, as a backup,
      // if the arg type is 'action' or 'node', use the
      // force of the default node, if the default node
      // exists. Then, use the first force available
      // in the mission. If that's still not an option,
      // throw an error because a mission should always
      // have at least one force.
      if (effect.sourceForce) {
        return effect.sourceForce
      } else if (type === 'action' || type === 'node') {
        return defaultNode.force
      } else if (type === 'pool') {
        return defaultPool.force
      } else if (mission.forces.length) {
        return mission.forces[0]
      } else {
        throw new Error(
          'No valid force found. A mission must have at least one force.',
        )
      }
    },
  )

  const [defaultFile] = useState<ClientMissionFile>(() => {
    // Return the first file in the mission. If
    // there is no file in the mission, then return
    // a detached file object.
    if (mission.files.length) {
      return mission.files[0]
    } else {
      return ClientMissionFile.createDetached(
        StringToolbox.generateRandomId(),
        'No files available.',
        mission,
      )
    }
  })

  const [defaultResource] = useState<MissionResource<TMetisClientComponents>>(
    () => {
      // Return the first resource in the mission. If
      // there is no resource in the mission, then return
      // a detached resource object.
      if (mission.resources.length) {
        return mission.resources[0]
      } else {
        return MissionResource.createDetached<TMetisClientComponents>(
          mission,
          StringToolbox.generateRandomId(),
          'No resources available.',
        )
      }
    },
  )

  /* -- FORCE STATE VALUES -- */

  const [optionalForceValue, setOptionalForceValue] =
    useState<ClientMissionForce | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (isOptional && existsInEffectArgs) {
        // Search for the force in the mission.
        let forceInMission = effect.getForceFromArgs(_id)
        // If the force is found then return the force.
        if (forceInMission) return forceInMission
        let forceInArgs = effect.getForceMetadataInArgs(_id)
        // If the force is not found, but the effect's arguments
        // contains the force's metadata then return a force
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (!forceInMission && forceInArgs) {
          return new ClientMissionForce(mission, {
            localKey: forceInArgs.forceKey,
            name: forceInArgs.forceName,
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
  const [forceValue, setForceValue] = useState<ClientMissionForce>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the force in the mission.
      let forceInMission = effect.getForceFromArgs(_id)
      // If the force is found then return the force.
      if (forceInMission) return forceInMission
      let forceInArgs = effect.getForceMetadataInArgs(_id)
      // If the force is not found, but the effect's arguments
      // contains the force's metadata then return a force
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (forceInArgs) {
        return new ClientMissionForce(mission, {
          localKey: forceInArgs.forceKey,
          name: forceInArgs.forceName,
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

  /* -- POOL STATE VALUES -- */

  const [poolValue, setPoolValue] = useState<
    ResourcePool<TMetisClientComponents>
  >(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the pool in the mission.
      let poolInMission = effect.getPoolFromArgs(_id)
      // If the pool is found then return the pool.
      if (poolInMission) return poolInMission
      let poolInArgs = effect.getPoolMetadataInArgs(_id)
      // If the pool is not found, but the effect's arguments
      // contains the pool's metadata then return a pool
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (poolInArgs) {
        return ResourcePool.createResourceDetachedFromKey<TMetisClientComponents>(
          forceValue,
          poolInArgs.poolKey,
          poolInArgs.poolName,
        )
      }
      // Otherwise, return the default pool.
      return defaultPool
    }
    // Otherwise, return the default pool.
    else {
      return defaultPool
    }
  })
  const [optionalPoolValue, setOptionalPoolValue] =
    useState<ResourcePool<TMetisClientComponents> | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (isOptional && existsInEffectArgs) {
        // Search for the pool in the mission.
        let poolInMission = effect.getPoolFromArgs(_id)
        // If the pool is found then return the pool.
        if (poolInMission) return poolInMission
        let poolInArgs = effect.getPoolMetadataInArgs(_id)
        // If the pool is not found, but the effect's arguments
        // contains the pool's metadata then return a pool
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (optionalForceValue && poolInArgs) {
          return ResourcePool.createResourceDetachedFromKey<TMetisClientComponents>(
            optionalForceValue,
            poolInArgs.poolKey,
            poolInArgs.poolName,
          )
        }
        // Otherwise, return null.
        return null
      }
      // Otherwise, return null.
      else {
        return null
      }
    })

  /* -- NODE STATE VALUES -- */

  const [nodeValue, setNodeValue] = useState<ClientMissionNode>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the node in the mission.
      let nodeInMission = effect.getNodeFromArgs(_id)
      // If the node is found then return the node.
      if (nodeInMission) return nodeInMission
      let nodeInArgs = effect.getNodeMetadataInArgs(_id)
      // If the node is not found, but the effect's arguments
      // contains the node's metadata then return a node
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (nodeInArgs) {
        return new ClientMissionNode(forceValue, {
          localKey: nodeInArgs.nodeKey,
          name: nodeInArgs.nodeName,
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
        let nodeInMission = effect.getNodeFromArgs(_id)
        // If the node is found then return the node.
        if (nodeInMission) return nodeInMission
        let nodeInArgs = effect.getNodeMetadataInArgs(_id)
        // If the node is not found, but the effect's arguments
        // contains the node's metadata then return a node
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (optionalForceValue && nodeInArgs) {
          return new ClientMissionNode(optionalForceValue, {
            localKey: nodeInArgs.nodeKey,
            name: nodeInArgs.nodeName,
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

  /* -- ACTION STATE VALUES -- */

  const [actionValue, setActionValue] = useState<ClientMissionAction>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the action in the mission.
      let actionInMission = effect.getActionFromArgs(_id)
      // If the action is found then return the action.
      if (actionInMission) return actionInMission
      let actionInArgs = effect.getActionMetadataInArgs(_id)
      // If the action is not found, but the effect's arguments
      // contains the action's metadata then return an action
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (actionInArgs) {
        return ClientMissionAction.fromJson(nodeValue, {
          localKey: actionInArgs.actionKey,
          name: actionInArgs.actionName,
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
        let actionInMission = effect.getActionFromArgs(_id)
        // If the action is found then return the action.
        if (actionInMission) return actionInMission
        let actionInArgs = effect.getActionMetadataInArgs(_id)
        // If the action is not found, but the effect's arguments
        // contains the action's metadata then return an action
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (optionalNodeValue && actionInArgs) {
          return ClientMissionAction.fromJson(optionalNodeValue, {
            localKey: actionInArgs.actionKey,
            name: actionInArgs.actionName,
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

  /* -- FILE STATE VALUES -- */

  const [fileValue, setFileValue] = useState<ClientMissionFile>(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the file in the mission.
      let fileInMission = effect.getFileFromArgs(_id)
      // If the file is found then return the file.
      if (fileInMission) return fileInMission
      let fileInArgs = effect.getFileMetadataInArgs(_id)
      // If the file is not found, but the effect's arguments
      // contains the file's metadata then return a file
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (fileInArgs) {
        return ClientMissionFile.createDetached(
          fileInArgs.fileId,
          fileInArgs.fileName,
          mission,
        )
      }
    }

    // Otherwise, return the default file.
    return defaultFile
  })
  const [optionalFileValue, setOptionalFileValue] =
    useState<ClientMissionFile | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (isOptional && existsInEffectArgs) {
        // Search for the file in the mission.
        let fileInMission = effect.getFileFromArgs(_id)
        // If the file is found then return the file.
        if (fileInMission) return fileInMission
        let fileInArgs = effect.getFileMetadataInArgs(_id)
        // If the file is not found, but the effect's arguments
        // contains the file's metadata then return a file
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (fileInArgs) {
          return ClientMissionFile.createDetached(
            fileInArgs.fileId,
            fileInArgs.fileName,
            mission,
          )
        }
      }
      // Otherwise, return null.
      return null
    })

  /* -- RESOURCE STATE VALUES -- */

  const [resourceValue, setResourceValue] = useState<
    MissionResource<TMetisClientComponents>
  >(() => {
    // If the argument is required and the argument's value
    // is in the effect's arguments...
    if (isRequired && existsInEffectArgs) {
      // Search for the resource in the mission.
      let resourceInMission = effect.getResourceFromArgs(_id)
      // If the resource is found then return the resource.
      if (resourceInMission) return resourceInMission
      let resourceInArgs = effect.getResourceMetadataInArgs(_id)
      // If the resource is not found, but the effect's arguments
      // contains the resource's metadata then return a resource
      // object using the metadata from the effect's arguments.
      // *** Note: This will display the user's previous selection
      // *** in the dropdown even though it no longer exists in the
      // *** mission.
      if (resourceInArgs) {
        return MissionResource.createDetached<TMetisClientComponents>(
          mission,
          resourceInArgs.resourceId,
          resourceInArgs.resourceName,
        )
      }
    }

    // Otherwise, return the default resource.
    return defaultResource
  })
  const [optionalResourceValue, setOptionalResourceValue] =
    useState<MissionResource<TMetisClientComponents> | null>(() => {
      // If the argument is optional and the argument's value
      // is in the effect's arguments...
      if (isOptional && existsInEffectArgs) {
        // Search for the resource in the mission.
        let resourceInMission = effect.getResourceFromArgs(_id)
        // If the resource is found then return the resource.
        if (resourceInMission) return resourceInMission
        let resourceInArgs = effect.getResourceMetadataInArgs(_id)
        // If the resource is not found, but the effect's arguments
        // contains the resource's metadata then return a resource
        // object using the metadata from the effect's arguments.
        // *** Note: This will display the user's previous selection
        // *** in the dropdown even though it no longer exists in the
        // *** mission.
        if (resourceInArgs) {
          return MissionResource.createDetached<TMetisClientComponents>(
            mission,
            resourceInArgs.resourceId,
            resourceInArgs.resourceName,
          )
        }
      }
      // Otherwise, return null.
      return null
    })

  /* -- COMPUTED -- */

  /* -- force -- */

  /**
   * Determines if the force should be present in the effect's arguments
   * and if the force dropdown should be displayed.
   */
  const forceIsActive: boolean = compute(
    () =>
      type === 'force' ||
      type === 'node' ||
      type === 'action' ||
      type === 'pool',
  )

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
   * Helps determine if the effect is targeting a mission component
   * that is in the same context as the effect.
   * @note **This will primarily be used to assist in duplicating
   * the effect's arguments if the effect is duplicated.**
   *
   * The heirarchy of a mission is as follows:
   * 1. Mission
   * 2. Force
   * 3. Node
   * 4. Action
   * 5. Effect
   *
   * So, it's possible to target the same force, node, or action
   * that the effect belongs to. If this is the case, then the
   * force context is `self`. Otherwise, it's `other`.
   */
  const forceContext: 'self' | 'other' = compute(() => {
    if (isRequired && forceValue.localKey === sourceForce?.localKey) {
      return 'self'
    }

    if (isOptional && optionalForceValue?.localKey === sourceForce?.localKey) {
      return 'self'
    }

    return 'other'
  })

  /**
   * The metadata for the force argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const forceMetadata: TForceMetadata = compute(() => {
    if (!forceIsActive) return {}

    if (forceContext === 'self') {
      return {
        [forceKey]: 'self',
        [forceName]: 'self',
      }
    }

    if (isOptional && upsertForce) {
      // *** Note: The "optionalForceValue" is validated within
      // *** the "upsertForce" computed property.
      return {
        [forceKey]: optionalForceValue!.localKey,
        [forceName]: optionalForceValue!.name,
      }
    }

    return {
      [forceKey]: forceValue.localKey,
      [forceName]: forceValue.name,
    }
  })

  /* -- pool -- */

  /**
   * Determines if the pool should be present in the effect's arguments
   * and if the pool dropdown should be displayed.
   */
  const poolIsActive: boolean = compute(() => type === 'pool')

  /**
   * Determines if the pool value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertPool: boolean = compute(() => {
    if (!poolIsActive) return false

    // If the argument is required and the pool exists in the
    // force's resource pools then upsert the pool to the effect's arguments.
    if (isRequired && forceValue.resourcePools.includes(poolValue)) {
      return true
    }

    // If the argument is optional, a force has been selected,
    // a pool has been selected, and the pool exists in the
    // force's resource pools then upsert the pool to the effect's arguments.
    if (
      isOptional &&
      optionalForceValue !== null &&
      optionalPoolValue !== null &&
      optionalForceValue.resourcePools.includes(optionalPoolValue)
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the pool value should be removed from the
   * effect's arguments.
   */
  const removePool: boolean = compute(() => {
    if (!poolIsActive) return true

    // If the argument is optional, a force has been selected,
    // a pool hasn't been selected, yet the argument exists
    // in the effect's arguments then remove the pool value
    // from the effect's arguments.
    if (
      isOptional &&
      existsInEffectArgs &&
      (!optionalForceValue || !optionalPoolValue)
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * The metadata for the pool argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const poolMetadata: TPoolMetadata = compute(() => {
    if (!poolIsActive) return {}

    if (isOptional && upsertPool) {
      // *** Note: The "optionalPoolValue" is validated within
      // *** the "upsertPool" computed property.
      return {
        ...forceMetadata,
        [poolKey]: optionalPoolValue!.localKey,
        [poolName]: optionalPoolValue!.name,
      }
    }

    return {
      ...forceMetadata,
      [poolKey]: poolValue.localKey,
      [poolName]: poolValue.name,
    }
  })

  /* -- node -- */

  /**
   * Determines if the node should be present in the effect's arguments
   * and if the node dropdown should be displayed.
   */
  const nodeIsActive: boolean = compute(
    () => type === 'node' || type === 'action',
  )

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
      existsInEffectArgs &&
      (!optionalForceValue || !optionalNodeValue)
    ) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Helps determine if the effect is targeting a mission component
   * that is in the same context as the effect.
   * @note **This will primarily be used to assist in duplicating
   * the effect's arguments if the effect is duplicated.**
   *
   * The heirarchy of a mission is as follows:
   * 1. Mission
   * 2. Force
   * 3. Node
   * 4. Action
   * 5. Effect
   *
   * So, it's possible to target the same force, node, or action
   * that the effect belongs to. If this is the case, then the
   * force context is `self`. Otherwise, it's `other`.
   */
  const nodeContext: 'self' | 'other' = compute(() => {
    if (forceContext === 'other') return 'other'

    if (isRequired && nodeValue.localKey === sourceNode?.localKey) {
      return 'self'
    }

    if (isOptional && optionalNodeValue?.localKey === sourceNode?.localKey) {
      return 'self'
    }

    return 'other'
  })

  /**
   * The metadata for the node argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const nodeMetadata: TNodeMetadata = compute(() => {
    if (!nodeIsActive) return {}

    if (nodeContext === 'self') {
      return {
        ...forceMetadata,
        [nodeKey]: 'self',
        [nodeName]: 'self',
      }
    }

    if (isOptional && upsertNode) {
      // *** Note: The "optionalNodeValue" is validated
      // *** within the "upsertNode" computed property.
      return {
        ...forceMetadata,
        [nodeKey]: optionalNodeValue!.localKey,
        [nodeName]: optionalNodeValue!.name,
      }
    }

    return {
      ...forceMetadata,
      [nodeKey]: nodeValue.localKey,
      [nodeName]: nodeValue.name,
    }
  })

  /** -- action -- */

  /**
   * Determines if the action should be present in the effect's arguments
   * and if the action dropdown should be displayed.
   */
  const actionIsActive: boolean = compute(() => type === 'action')

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
   * Helps determine if the effect is targeting a mission component
   * that is in the same context as the effect.
   * @note **This will primarily be used to assist in duplicating
   * the effect's arguments if the effect is duplicated.**
   *
   * The heirarchy of a mission is as follows:
   * 1. Mission
   * 2. Force
   * 3. Node
   * 4. Action
   * 5. Effect
   *
   * So, it's possible to target the same force, node, or action
   * that the effect belongs to. If this is the case, then the
   * force context is `self`. Otherwise, it's `other`.
   */
  const actionContext: 'self' | 'other' = compute(() => {
    if (forceContext === 'other' || nodeContext === 'other') return 'other'

    if (isRequired && actionValue.localKey === sourceAction?.localKey) {
      return 'self'
    }

    if (
      isOptional &&
      optionalActionValue?.localKey === sourceAction?.localKey
    ) {
      return 'self'
    }

    return 'other'
  })

  /**
   * The metadata for the action argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const actionMetadata: TActionMetadata = compute(() => {
    if (!actionIsActive) return {}

    if (actionContext === 'self') {
      return {
        ...nodeMetadata,
        [actionKey]: 'self',
        [actionName]: 'self',
      }
    }

    if (isOptional && upsertAction) {
      // *** Note: The "optionalActionValue" is validated within
      // *** the "upsertAction" computed property.
      return {
        ...nodeMetadata,
        [actionKey]: optionalActionValue!.localKey,
        [actionName]: optionalActionValue!.name,
      }
    }

    return {
      ...nodeMetadata,
      [actionKey]: actionValue.localKey,
      [actionName]: actionValue.name,
    }
  })

  /* -- file -- */

  /**
   * Determines if the file should be present in the effect's arguments
   * and if the file dropdown should be displayed.
   */
  const fileIsActive: boolean = compute(() => type === 'file')

  /**
   * Determines if the file value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertFile: boolean = compute(() => {
    if (!fileIsActive) return false

    // If the argument is required then add the file value
    // to the effect's arguments.
    if (isRequired) return true

    // If the argument is optional and a file has been selected
    // then upsert the file to the effect's arguments.
    if (isOptional && optionalFileValue !== null) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the file value should be removed from the
   * effect's arguments.
   */
  const removeFile: boolean = compute(() => {
    if (!fileIsActive) return true

    // If the argument is optional, a file hasn't been selected,
    // yet the argument exists in the effect's arguments then remove
    // the file value from the effect's arguments.
    if (isOptional && optionalFileValue === null && existsInEffectArgs) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * The metadata for the file argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const fileMetadata: TFileMetadata = compute(() => {
    if (!fileIsActive) return {}

    if (isOptional && upsertFile) {
      // *** Note: The "optionalFileValue" is validated within
      // *** the "upsertFile" computed property.
      return {
        [fileId]: optionalFileValue!._id,
        [fileName]: optionalFileValue!.name,
      }
    }

    return {
      [fileId]: fileValue._id,
      [fileName]: fileValue.name,
    }
  })

  /* -- resource -- */

  /**
   * Determines if the resource should be present in the effect's arguments
   * and if the resource dropdown should be displayed.
   */
  const resourceIsActive: boolean = compute(() => type === 'resource')

  /**
   * Determines if the resource value should be inserted or updated in the
   * effect's arguments.
   */
  const upsertResource: boolean = compute(() => {
    if (!resourceIsActive) return false

    // If the argument is required then add the resource value
    // to the effect's arguments.
    if (isRequired) return true

    // If the argument is optional and a resource has been selected
    // then upsert the resource to the effect's arguments.
    if (isOptional && optionalResourceValue !== null) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * Determines if the resource value should be removed from the
   * effect's arguments.
   */
  const removeResource: boolean = compute(() => {
    if (!resourceIsActive) return true

    // If the argument is optional, a resource hasn't been selected,
    // yet the argument exists in the effect's arguments then remove
    // the resource value from the effect's arguments.
    if (isOptional && optionalResourceValue === null && existsInEffectArgs) {
      return true
    }

    // Otherwise, return false.
    return false
  })

  /**
   * The metadata for the resource argument.
   * @note This is the metadata that is passed to the effect's arguments.
   */
  const resourceMetadata: TResourceMetadata = compute(() => {
    if (!resourceIsActive) return {}

    if (isOptional && upsertResource) {
      // *** Note: The "optionalResourceValue" is validated within
      // *** the "upsertResource" computed property.
      return {
        [resourceId]: optionalResourceValue!._id,
        [resourceName]: optionalResourceValue!.name,
      }
    }

    return {
      [resourceId]: resourceValue._id,
      [resourceName]: resourceValue.name,
    }
  })

  /* -- EFFECTS -- */

  // Determine if the argument needs to be initialized.
  useEffect(() => {
    if (initialize) initializeArg()
  }, [initialize])

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
    fileValue,
    optionalForceValue,
    optionalNodeValue,
    optionalActionValue,
    optionalFileValue,
    poolValue,
    optionalPoolValue,
    resourceValue,
    optionalResourceValue,
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

      // If the file value stored in the state is the
      // same as the default file value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (fileValue === defaultFile) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert()
      }
      // Otherwise, set the file value to the default file value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setFileValue(defaultFile)
      }

      // If the pool value stored in the state is the
      // same as the default pool value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (poolValue === defaultPool) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert()
      }
      // Otherwise, set the pool value to the default pool value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setPoolValue(defaultPool)
      }

      // If the resource value stored in the state is the
      // same as the default resource value, then manually update the
      // effect's arguments by adding this argument and its
      // value.
      if (resourceValue === defaultResource) {
        // *** Note: An argument's value in the effect's
        // *** arguments is automatically set if the value
        // *** stored in this state changes. If the value
        // *** in the state doesn't change then the value
        // *** needs to be set manually.
        upsert()
      }
      // Otherwise, set the resource value to the default resource value.
      // *** Note: A default value is mandatory if the
      // *** argument is required.
      else {
        // *** Note: When this value in the state changes,
        // *** the effect's arguments automatically updates
        // *** with the current value.
        setResourceValue(defaultResource)
      }
    }
  }

  /**
   * Updates or inserts the provided argument(s) into the effect's arguments.
   */
  const upsert = () => {
    // Initialize the data.
    let data: TMissionComponentMetadata = {}

    if (upsertForce) data = forceMetadata
    if (upsertNode) data = nodeMetadata
    if (upsertAction) data = actionMetadata
    if (upsertFile) data = fileMetadata
    if (upsertPool) data = poolMetadata
    if (upsertResource) data = resourceMetadata

    // Update the effect's arguments with the new data.
    setEffectArgs((prev) => ({
      ...prev,
      [_id]: {
        ...prev[_id],
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
        delete prev[_id][forceKey]
        delete prev[_id][forceName]
      }
      if (removeNode) {
        delete prev[_id][nodeKey]
        delete prev[_id][nodeName]
      }
      if (removeAction) {
        delete prev[_id][actionKey]
        delete prev[_id][actionName]
      }
      if (removeFile) {
        delete prev[_id][fileId]
        delete prev[_id][fileName]
      }
      if (removePool) {
        delete prev[_id][poolKey]
        delete prev[_id][poolName]
      }
      if (removeResource) {
        delete prev[_id][resourceId]
        delete prev[_id][resourceName]
      }

      // If the argument is empty, then remove the argument
      // from the effect's arguments.
      if (
        Object.keys(prev[_id]).length === 0 &&
        prev[_id][forceKey] === undefined &&
        prev[_id][nodeKey] === undefined &&
        prev[_id][actionKey] === undefined &&
        prev[_id][fileId] === undefined &&
        prev[_id][poolKey] === undefined &&
        prev[_id][resourceId] === undefined
      ) {
        delete prev[_id]
      }

      return prev
    })
  }

  /* -- RENDER -- */

  return (
    <>
      <ArgForce
        effect={effect}
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        forceIsActive={forceIsActive}
        forceValue={[forceValue, setForceValue]}
        optionalForceValue={[optionalForceValue, setOptionalForceValue]}
      />
      <ArgPool
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        poolIsActive={poolIsActive}
        isRequired={isRequired}
        isOptional={isOptional}
        forceValue={[forceValue, setForceValue]}
        optionalForceValue={[optionalForceValue, setOptionalForceValue]}
        poolValue={[poolValue, setPoolValue]}
        optionalPoolValue={[optionalPoolValue, setOptionalPoolValue]}
      />
      <ArgNode
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        nodeIsActive={nodeIsActive}
        isRequired={isRequired}
        isOptional={isOptional}
        forceValue={[forceValue, setForceValue]}
        nodeValue={[nodeValue, setNodeValue]}
        optionalForceValue={[optionalForceValue, setOptionalForceValue]}
        optionalNodeValue={[optionalNodeValue, setOptionalNodeValue]}
      />
      <ArgAction
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        actionIsActive={actionIsActive}
        isRequired={isRequired}
        isOptional={isOptional}
        forceValue={[forceValue, setForceValue]}
        nodeValue={[nodeValue, setNodeValue]}
        actionValue={[actionValue, setActionValue]}
        optionalForceValue={[optionalForceValue, setOptionalForceValue]}
        optionalNodeValue={[optionalNodeValue, setOptionalNodeValue]}
        optionalActionValue={[optionalActionValue, setOptionalActionValue]}
      />
      <ArgFile
        effect={effect}
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        fileIsActive={fileIsActive}
        fileValue={[fileValue, setFileValue]}
        optionalFileValue={[optionalFileValue, setOptionalFileValue]}
      />
      <ArgResource
        effect={effect}
        arg={arg}
        existsInEffectArgs={existsInEffectArgs}
        resourceIsActive={resourceIsActive}
        resourceValue={[resourceValue, setResourceValue]}
        optionalResourceValue={[
          optionalResourceValue,
          setOptionalResourceValue,
        ]}
      />
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
