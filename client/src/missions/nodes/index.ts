import { IMissionMappable } from 'src/components/content/game/MissionMap'
import ClientMission from '..'
import { IMissionActionJSON } from '../../../../shared/missions/actions'
import { TActionExecutionJSON } from '../../../../shared/missions/actions/executions'
import { IActionOutcomeJSON } from '../../../../shared/missions/actions/outcomes'
import MissionNode, {
  TMissionNodeJSON,
  INodeOpenOptions,
  TMissionNodeOptions,
  IHandleOutcomeOptions,
} from '../../../../shared/missions/nodes'
import ClientMissionAction from '../actions'
import ClientActionExecution from '../actions/executions'
import ClientActionOutcome from '../actions/outcomes'
import axios from 'axios'

/**
 * Options for the ClientMissionNode.open method.
 */
export interface INodeClientOpenOptions extends INodeOpenOptions {
  /**
   * The child node data with which to populate the now open node.
   * @note Fails if the node already has children.
   * @default undefined
   */
  revealedChildNodes?: Array<TMissionNodeJSON>
}

/**
 * Options for the `ClientMissionNode.handleOutcome` method.
 */
export interface IClientHandleOutcomeOptions extends IHandleOutcomeOptions {
  /**
   * The child node data with which to populate the now open node.
   * @note Unused if the node already has children or if the outcome was a failure.
   * @default undefined
   */
  revealedChildNodes?: Array<TMissionNodeJSON>
}

/**
 * The relation of the target node to the node being added.
 */
export enum ENodeTargetRelation {
  ParentOfTargetAndChildren,
  ParentOfTargetOnly,
  ChildOfTarget,
  BetweenTargetAndChildren,
  PreviousSiblingOfTarget,
  FollowingSiblingOfTarget,
}

/**
 * Method for deleting a node.
 */
export enum ENodeDeleteMethod {
  /**
   * Deletes the node and all of its children.
   */
  DeleteNodeAndChildren,
  /**
   * Deletes the node and transfers its children to the node's parent.
   */
  DeleteNodeAndShiftChildren,
}

/**
 * Options for ClientMissionNode.delete.
 */
export interface INodeDeleteOptions {
  calledByParentDelete?: boolean // Default "false"
  deleteMethod?: ENodeDeleteMethod // Default "ENodeDeleteMethod.DeleteNodeAndChildren"
}

/**
 * Class for managing mission nodes on the client.
 */
export default class ClientMissionNode
  extends MissionNode<
    ClientMission,
    ClientMissionNode,
    ClientMissionAction,
    ClientActionExecution,
    ClientActionOutcome
  >
  implements IMissionMappable
{
  // Implemented
  public mapX: number
  // Implemented
  public mapY: number
  // Implemented
  public depth: number

  /**
   * Whether the node is expanded in the `NodeStructuring` component.
   */
  private _expandedInMenu: boolean = false
  /**
   * Whether the node is expanded in the `NodeStructuring` component.
   */
  public get expandedInMenu(): boolean {
    return this._expandedInMenu
  }

  /**
   * Whether the node is collapsed in the `NodeStructuring` component.
   * @note Direct inverse of `expandedInMenu`.
   */
  public get collapsedInMenu(): boolean {
    return !this._expandedInMenu
  }

  public constructor(
    mission: ClientMission,
    data: Partial<TMissionNodeJSON> = MissionNode.DEFAULT_PROPERTIES,
    options: TMissionNodeOptions<ClientMissionNode> = {},
  ) {
    super(mission, data, options)

    this.mapX = 0
    this.mapY = 0
    this.depth = -1
  }

  // Implemented
  protected parseActionData(
    data: IMissionActionJSON[],
  ): Map<string, ClientMissionAction> {
    let actions: Map<string, ClientMissionAction> = new Map<
      string,
      ClientMissionAction
    >()
    data.forEach((datum) => {
      let action: ClientMissionAction = new ClientMissionAction(this, datum)
      actions.set(action.actionID, action)
    })
    return actions
  }

  // Implemented
  protected parseExecutionData(
    data: TActionExecutionJSON,
  ): ClientActionExecution | null {
    // If data is null return null.
    if (data === null) {
      return null
    }

    // Get action for the ID passed.
    let action: ClientMissionAction | undefined = this.actions.get(
      data.actionID,
    )

    // Handle undefined action.
    if (action === undefined) {
      throw new Error('Action not found for given execution datum.')
    }

    // Return new execution object.
    return new ClientActionExecution(action, data.start, data.end)
  }

  // Implemented
  protected parseOutcomeData(
    data: IActionOutcomeJSON[],
  ): Array<ClientActionOutcome> {
    return data.map((datum: IActionOutcomeJSON) => {
      let action: ClientMissionAction | undefined = this.actions.get(
        datum.actionID,
      )

      // Handle undefined action.
      if (action === undefined) {
        throw new Error('Action not found for given outcome datum.')
      }

      return new ClientActionOutcome(action, datum.successful)
    })
  }

  // Implemented
  public open(options: INodeClientOpenOptions = {}): Promise<void> {
    // Parse options.
    let { revealedChildNodes } = options

    // Return a promise to open the node.
    return new Promise<void>((resolve) => {
      // If the node is openable...
      if (this.openable) {
        // Set the node to open.
        this.opened = true
        // Update last opened node cache.
        this.mission.lastOpenedNode = this
        // Reveal child nodes, if any.
        if (revealedChildNodes !== undefined) {
          this.populateChildNodes(revealedChildNodes)
        }
        // Handle structure change.
        this.mission.handleStructureChange()
        // Resolve.
        resolve()
      } else {
        throw new Error('Node is not openable.')
      }
    })
  }

  // Implemented
  public handleExecution(
    data: NonNullable<TActionExecutionJSON>,
  ): ClientActionExecution {
    // Get the action action being executed.
    let { actionID } = data
    let action = this.actions.get(actionID)

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the execution data.',
      )
    }
    // Throw an error if not executable.
    if (!this.executable) {
      throw new Error('Cannot handle execution: Node is not executable.')
    }
    // Throw an error if non ready to execute.
    if (!this.readyToExecute) {
      throw new Error('Cannot handle execution: Node is not ready to execute.')
    }

    // Generate and set the node's execution.
    this._execution = new ClientActionExecution(action, data.start, data.end)

    // Return execution.
    return this._execution
  }

  // Implemented
  public handleOutcome(
    data: IActionOutcomeJSON,
    options: IClientHandleOutcomeOptions = {},
  ): ClientActionOutcome {
    // Parse data and options.
    const { actionID, successful } = data
    const { revealedChildNodes } = options

    // Get the action for the outcome.
    let action = this.actions.get(actionID)

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the outcome data.',
      )
    }
    // Throw an error if the execution state is not executed.
    if (this.executionState !== 'executing') {
      throw new Error('Cannot handle outcome: Node is not executing.')
    }

    // Generate outcome.
    let outcome = new ClientActionOutcome(action, successful)

    // Add to list of outcomes.
    this._outcomes.push(outcome)

    // Remove execution.
    this._execution = null

    // If the outcome is successful...
    if (successful) {
      // Update last opened node cache.
      this.mission.lastOpenedNode = this
      // Reveal child nodes, if any.
      if (revealedChildNodes !== undefined) {
        this.populateChildNodes(revealedChildNodes)
      }
      // Handle structure change.
      this.mission.handleStructureChange()
    }

    // Return outcome.
    return outcome
  }

  /**
   * Moves this node to the given target, positioning based on the target relation passed.
   * @param target The target node to which this node will be moved.
   * @param targetRelation Where in relation to the target this node will be newly positioned.
   */
  public move(
    target: ClientMissionNode,
    targetRelation: ENodeTargetRelation,
  ): void {
    let rootNode: ClientMissionNode = this.mission.rootNode
    let parentNode: ClientMissionNode | null = this.parentNode
    let newParentNode: ClientMissionNode | null = target.parentNode
    let newParentNodeChildNodes: Array<ClientMissionNode> = []

    // This makes sure that the target
    // isn't being moved inside or beside
    // itself.
    let x: ClientMissionNode | null = target

    while (x !== null && x.nodeID !== rootNode.nodeID) {
      if (this.nodeID === x.nodeID) {
        return
      }

      x = x.parentNode
    }

    // This will remove the nodes
    // current position in the structure.
    if (parentNode !== null) {
      let siblings: ClientMissionNode[] = parentNode.childNodes

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this.nodeID === sibling.nodeID) {
          siblings.splice(index, 1)
        }
      }
    }

    // This will move the target based on
    // its relation to this node.
    switch (targetRelation) {
      case ENodeTargetRelation.ParentOfTargetOnly:
        this.parentNode = target.parentNode
        let targetAndTargetSiblings: Array<ClientMissionNode> =
          target.childrenOfParent

        if (target.parentNode !== null) {
          for (
            let index: number = 0;
            index < targetAndTargetSiblings.length;
            index++
          ) {
            let sibling = targetAndTargetSiblings[index]

            if (target.nodeID === sibling.nodeID) {
              targetAndTargetSiblings[index] = this
            }
          }

          target.parentNode.childNodes = targetAndTargetSiblings
        }

        this.childNodes = [target]
        target.parentNode = this
        break
      case ENodeTargetRelation.ParentOfTargetAndChildren:
        // TODO
        break
      case ENodeTargetRelation.BetweenTargetAndChildren:
        let childNodes: Array<ClientMissionNode> = target.childNodes

        target.childNodes = [this]
        this.parentNode = target

        for (let childNode of childNodes) {
          childNode.parentNode = this
        }
        this.childNodes = childNodes
        break
      case ENodeTargetRelation.ChildOfTarget:
        target.childNodes.push(this)
        this.parentNode = target
        break
      case ENodeTargetRelation.PreviousSiblingOfTarget:
        if (newParentNode !== null) {
          newParentNode.childNodes.forEach((childNode: ClientMissionNode) => {
            if (childNode.nodeID === target.nodeID) {
              newParentNodeChildNodes.push(this)
              this.parentNode = newParentNode
            }

            newParentNodeChildNodes.push(childNode)
          })

          newParentNode.childNodes = newParentNodeChildNodes
        }
        break
      case ENodeTargetRelation.FollowingSiblingOfTarget:
        if (newParentNode !== null) {
          newParentNode.childNodes.forEach((childNode: ClientMissionNode) => {
            newParentNodeChildNodes.push(childNode)

            if (childNode.nodeID === target.nodeID) {
              newParentNodeChildNodes.push(this)
              this.parentNode = newParentNode
            }
          })

          newParentNode.childNodes = newParentNodeChildNodes
        }
        break
    }

    this.mission.handleStructureChange()
  }

  /**
   * This will color all descendant nodes the same color as this node.
   */
  public applyColorFill(): void {
    for (let childNode of this.childNodes) {
      childNode.color = this.color
      childNode.applyColorFill()
    }
  }

  /**
   * Delete a node.
   * @param options Options for how the node should be deleted.
   */
  public delete(
    options: INodeDeleteOptions = {
      calledByParentDelete: false,
      deleteMethod: ENodeDeleteMethod.DeleteNodeAndChildren,
    },
  ): void {
    let calledByParentDelete: boolean = options.calledByParentDelete === true
    let deleteMethod: ENodeDeleteMethod = options.deleteMethod
      ? options.deleteMethod
      : ENodeDeleteMethod.DeleteNodeAndChildren

    switch (deleteMethod) {
      case ENodeDeleteMethod.DeleteNodeAndChildren:
        let childNodes: Array<ClientMissionNode> = [...this.childNodes]

        for (let childNode of childNodes) {
          let childOptions: INodeDeleteOptions = {
            ...options,
            calledByParentDelete: true,
          }
          childNode.delete(childOptions)
        }

        this.childrenOfParent.splice(this.childrenOfParent.indexOf(this), 1)
        this.mission.nodes.delete(this.nodeID)
        break
      case ENodeDeleteMethod.DeleteNodeAndShiftChildren:
        let parentOfThis: ClientMissionNode | null = this.parentNode
        let childrenofThis: Array<ClientMissionNode> = [...this.childNodes]

        childrenofThis.forEach((childNode: ClientMissionNode) => {
          if (parentOfThis !== null) {
            parentOfThis.childNodes.splice(
              parentOfThis.childNodes.indexOf(this),
              0,
              childNode,
            )
            childNode.parentNode = parentOfThis
          }
        })

        if (parentOfThis !== null) {
          parentOfThis.childNodes.splice(
            parentOfThis.childNodes.indexOf(this),
            1,
          )
          this.mission.nodes.delete(this.nodeID)
          this.mission.handleStructureChange()
        }
        break
    }

    if (calledByParentDelete !== true) {
      // Structure change is handled as long
      // as one node exists. If not, a new
      // node is created. Creating this node
      // will handle the structure change for
      // us.
      if (this.mission.nodes.size > 0) {
        this.mission.handleStructureChange()
      } else {
        this.mission.spawnNode()
      }
    }
  }

  /**
   * Populates the children of the node, if not already populated.
   * @param {Array<TMissionNodeJSON>} data The child node data with which to populate the node.
   */
  protected populateChildNodes(
    data: Array<TMissionNodeJSON>,
  ): Array<ClientMissionNode> {
    // If child nodes are already set,
    // throw an error.
    if (this.childNodes.length > 0) {
      throw new Error('Child nodes are already populated.')
    }

    // Generate child nodes.
    let childNodes: Array<ClientMissionNode> = data.map((datum) => {
      // Create a new node.
      let childNode: ClientMissionNode = new ClientMissionNode(
        this.mission,
        datum,
      )

      // Set the node in the missions.
      this.mission.nodes.set(childNode.nodeID, childNode)

      // Return node
      return childNode
    })

    // Set child nodes.
    this.childNodes = childNodes

    // Return the child nodes.
    return childNodes
  }

  /**
   * Toggle the expandedInMenu property between true and false.
   */
  public toggleMenuExpansion(): void {
    this._expandedInMenu = !this._expandedInMenu
  }

  /* -- API -- */

  /* -- API | READ -- */

  /**
   * Fetches available colors for nodes.
   * @returns {Promise<Array<string>>} A promise that resolves to the available colors.
   */
  public static async fetchColors(): Promise<Array<string>> {
    return new Promise<Array<string>>(async (resolve, reject) => {
      try {
        let { data: colors } = await axios.get<Array<string>>(
          `${ClientMission.API_ENDPOINT}/colors/`,
        )
        resolve(colors)
      } catch (error) {
        console.error('Failed to retrieve the color options.')
        console.error(error)
        reject(error)
      }
    })
  }
}
