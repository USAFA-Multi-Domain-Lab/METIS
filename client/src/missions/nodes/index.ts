import memoizeOne from 'memoize-one'
import { TMetisClientComponents } from 'src'
import {
  TMapCompatibleNode,
  TMapCompatibleNodeEvent,
  TNodeButton,
} from 'src/components/content/session/mission-map/objects/nodes'
import { TRequestMethod } from '../../../../shared/connect/data'
import {
  EventManager,
  TListenerTargetEmittable,
} from '../../../../shared/events'
import { TMissionActionJson } from '../../../../shared/missions/actions'
import { TActionExecutionJson } from '../../../../shared/missions/actions/executions'
import MissionNode, {
  TMissionNodeJson,
} from '../../../../shared/missions/nodes'
import ClientMissionAction from '../actions'
import ClientActionExecution from '../actions/executions'
import ClientMissionForce from '../forces'

/**
 * Class for managing mission nodes on the client.
 */
export default class ClientMissionNode
  extends MissionNode<TMetisClientComponents>
  implements TListenerTargetEmittable<TNodeEventMethod>, TMapCompatibleNode
{
  // Overridden
  public get name(): string {
    return this._name
  }
  public set name(value: string) {
    this._name = value
    this.emitEvent('set-name')
  }

  // Overridden
  public get color(): string {
    return this._color
  }
  public set color(value: string) {
    this._color = value
    this.emitEvent('set-color')
  }

  // Overridden
  public get executable(): boolean {
    return this._executable
  }
  public set executable(value: boolean) {
    this._executable = value
    this.emitEvent('new-icon')
  }

  // Overridden
  public get device(): boolean {
    return this._device
  }
  public set device(value: boolean) {
    this._device = value
    this.emitEvent('new-icon')
  }

  // Implemented
  public get exclude(): boolean {
    return this._exclude
  }
  public set exclude(value: boolean) {
    this._exclude = value
    this.force.handleStructureChange()
    this.emitEvent('set-exclude')
    this.mission.emitEvent('set-node-exclusion', [this])
  }

  /**
   * Whether the node is pending an "node-opened" event from the server.
   * This is used when the client requests to open a node, but the server
   * has not yet responded.
   */
  private _pendingOpen: boolean = false
  /**
   * Whether the node is pending an "node-opened" event from the server.
   * @note This is used when the client requests to open a node, but the server
   * has not yet responded.
   * @throws In setter if the node is not openable.
   */
  private set pendingOpen(value: boolean) {
    this._pendingOpen = value
    this.emitEvent('set-pending')
  }
  public get pendingOpen(): boolean {
    return this._pendingOpen
  }

  /**
   * Whether the node is pending an "action-execution-initiated" event from the server.
   * @note This is used when the client requests to execute an action, but the server
   * has not yet responded.
   */
  private _pendingExecInit: boolean = false
  /**
   * Whether the node is pending an "action-execution-initiated" event from the server.
   * @node This is used when the client requests to execute an action, but the server
   * has not yet responded.
   * @throws In setter if the node is not executable.
   */
  public get pendingExecInit(): boolean {
    return this._pendingExecInit
  }
  public set pendingExecInit(value: boolean) {
    this._pendingExecInit = value
    this.emitEvent('set-pending')
  }

  /**
   * Whether the node is pending an "output-sent" event from the server.
   * @note This is used when the client requests to send a message to the
   * output panel, but the server has not yet responded.
   */
  private _pendingOutputSent: boolean = false
  /**
   * Whether the node is pending an "output-sent" event from the server.
   * @note This is used when the client requests to send a message to the
   * output panel, but the server has not yet responded.
   */
  public get pendingOutputSent(): boolean {
    return this._pendingOutputSent
  }
  public set pendingOutputSent(value: boolean) {
    this._pendingOutputSent = value
    this.emitEvent('set-pending')
  }

  // Implemented
  public get pending(): boolean {
    return this.pendingOpen || this.pendingExecInit || this.pendingOutputSent
  }

  /**
   * Memoized function for computing the value of `nameLineCount`.
   * @param name The name for which to compute the line count.
   * @returns The number of lines needed to display the name.
   * @memoized
   */
  private computeNameLineCount = memoizeOne((name: string) => {
    // Reduce any multiple spaces to a single space
    // since the browser will do this during render.
    name = name.replace(/ {2,}/g, ' ')

    // Split the name into words.
    let words: string[] = name.split(' ')

    // Define various other variables.
    let lineCount: number = 1
    let charactersPerLine: number = ClientMissionNode.CHARACTERS_PER_LINE
    let lineCursor: string = ''

    // Loop through each word.
    for (let word of words) {
      // If the word is too long for one line,
      // break the word down into multiple lines.
      if (word.length > charactersPerLine) {
        // Determine the number of lines the word
        // will take up.
        let wordLineCount: number = Math.ceil(word.length / charactersPerLine)
        // Determine the number of lines that need
        // to be added to the overall line count.
        let newLinesNeeded: number = wordLineCount
        // Decrease by one if the current line is
        // empty, since this line can be used for
        // the first line of the word.
        if (lineCursor.length === 0) {
          newLinesNeeded--
        }
        // Set the line cursor to the last line
        // of the word.
        lineCursor = word.slice(charactersPerLine * (wordLineCount - 1)) + ' '
        // Increase the line count by the number
        // of lines needing to be added.
        lineCount += newLinesNeeded
      }
      // Else if the word plus the characters already on the line
      // exceeds the number of characters allowed per line...
      else if (word.length + lineCursor.length > charactersPerLine) {
        // Start a new line of words.
        lineCount++
        lineCursor = word + ' '
      }
      // Else include the word on the current line.
      else {
        lineCursor += word + ' '
      }
    }

    // Return the calculated number of lines.
    return lineCount
  })
  /**
   * The required number of lines needed to display the node's name
   * on the mission map.
   */
  public get nameLineCount(): number {
    return this.computeNameLineCount(this.name)
  }

  /**
   * The height needed to display the node's name on the mission map.
   */
  public get nameNeededHeight(): number {
    return (
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE *
      this.nameLineCount
    )
  }

  /**
   * The height of the node's name on the mission map.
   */
  public get nameHeight(): number {
    return Math.max(
      ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT,
      this.nameNeededHeight,
    )
  }

  /**
   * The height of the node on the mission map.
   */
  public get height(): number {
    return ClientMissionNode.VERTICAL_PADDING + this.nameHeight
  }

  public get width(): number {
    const { nonRevealedDisplayMode } = this.mission
    const useExcludeWidth = nonRevealedDisplayMode === 'show' && this.exclude
    if (useExcludeWidth) return ClientMissionNode.EXCLUDED_WIDTH
    return ClientMissionNode.WIDTH
  }

  /**
   * Buttons to manage this specific node on a mission map.
   */
  private _buttons: TNodeButton<ClientMissionNode>[]
  /**
   * Buttons to manage this specific node on a mission map.
   */
  public get buttons(): TNodeButton<ClientMissionNode>[] {
    return [...this._buttons]
  }
  public set buttons(value: TNodeButton<ClientMissionNode>[]) {
    // Gather details.
    let structureChange: boolean = false

    // If button count changed from 0 to some
    // or some to 0, mark to handle structure change.
    if (
      (this.buttons.length > 0 && value.length === 0) ||
      (this.buttons.length === 0 && value.length > 0)
    ) {
      structureChange = true
    }

    // Set buttons.
    this._buttons = value

    // Emit event.
    this.emitEvent('set-buttons')

    // Handle structure change.
    if (structureChange) {
      this.mission.handleStructureChange()
    }
  }

  // Implemented
  public get icon(): TMetisIcon {
    if (this.executable) {
      if (this.device) return 'device'
      else return 'lightning'
    } else {
      return '_blank'
    }
  }

  /**
   * Whether the node, or any nested objects, are selected
   * in the mission.
   */
  public get selected(): boolean {
    let selection = this.mission.selection

    if (selection instanceof ClientMissionNode) {
      return this.mission.selection === this
    } else if ('node' in selection) {
      return selection.node === this
    } else {
      return false
    }
  }

  /**
   * The execution time remaining for the node.
   */
  public get execTimeRemaining(): string {
    return this.latestExecution?.timeRemainingFormatted ?? '00:00:00'
  }

  /**
   * Manages the mission's event listeners and events.
   */
  private eventManager: EventManager<TNodeEventMethod>

  /**
   * @param force The force of which the node is a part.
   * @param data The node data from which to create the node.
   *  @note Any ommitted values will be set to their default properties
   *  defined in `ClientMissionNode.DEFAULT_PROPERTIES`.
   */
  public constructor(
    force: ClientMissionForce,
    data: Partial<TMissionNodeJson> = ClientMissionNode.DEFAULT_PROPERTIES,
  ) {
    super(force, data)
    this._buttons = []

    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent
  }

  // Implemented
  protected importActions(data: TMissionActionJson[]): void {
    data.forEach((datum) => {
      let action: ClientMissionAction = new ClientMissionAction(this, datum)
      this.actions.set(action._id, action)
    })
  }

  // Implemented
  protected importExecutions(data: TActionExecutionJson[]): void {
    this._executions = data.map(
      ({ _id, actionId, outcome: outcomeData, start, end }) => {
        let action: ClientMissionAction | undefined = this.actions.get(actionId)
        if (!action) throw new Error(`Action "${actionId}" not found.`)
        return new ClientActionExecution(_id, action, start, end, {
          outcomeData,
        })
      },
    )
  }

  // Implemented
  public emitEvent

  // Implemented
  public addEventListener

  // Implemented
  public removeEventListener

  /**
   * Handles node-specific, server-connection events that occur in-session.
   * @param method The method of the request event.
   */
  public handleRequestMade(method: TRequestMethod): void {
    // Handle method accordingly.
    switch (method) {
      case 'request-open-node':
        this.pendingOpen = true
        break
      case 'request-execute-action':
        this.pendingExecInit = true
        break
      case 'request-send-output':
        this.pendingOutputSent = true
        break
    }

    // Emit 'request-made' event.
    this.emitEvent('request-made')
  }

  /**
   * Handles node-specific, server-connection events that failed in-session.
   * @param method The method of the request event.
   */
  public handleRequestFailed(method: TRequestMethod): void {
    // Handle method accordingly.
    switch (method) {
      case 'request-open-node':
        this.pendingOpen = false
        break
      case 'request-execute-action':
        this.pendingExecInit = false
        break
      case 'request-send-output':
        this.pendingOutputSent = false
        break
    }

    // Emit 'request-failed' event.
    this.emitEvent('request-failed')
  }

  /**
   * Processses an open event emitted by the server.
   * @param revealedDescendants The nodes revealed by the opening of the node.
   */
  public onOpen(revealedDescendants: TMissionNodeJson[] | undefined): void {
    if (revealedDescendants) {
      if (!this.openable && !this.executed) {
        throw new Error(`Node ${this._id} is not openable.`)
      }
      // Set the node to open.
      this._opened = true
      // Update last opened node cache.
      this.mission.lastOpenedNode = this
      // Reveal nodes, if any.
      this.populateDescendants(revealedDescendants)
      // Handle structure change.
      this.mission.handleStructureChange()
      // Set pending open to false.
      this.pendingOpen = false
      // Emit event.
      this.emitEvent('open')
    }
  }

  // Overridden
  public onExecution(execution: ClientActionExecution): void {
    super.onExecution(execution)
    this.pendingExecInit = false
    this.emitEvent('exec-state-change')
  }

  /**
   * Handles node-specific outputs that have been sent
   * to the output panel via the server.
   */
  public onOutput(): void {
    // Set pending output sent to false.
    this.pendingOutputSent = false

    // Emit event.
    this.emitEvent('output-sent')
  }

  // Implemented
  public updateBlockStatus(blocked: boolean): void {
    // Blocks this node and all of its revealed descendants.
    const algorithm = (blocked: boolean, node: ClientMissionNode = this) => {
      node._blocked = blocked
      node.emitEvent('set-blocked')
      node.revealedDescendants.forEach((descendant) => {
        algorithm(blocked, descendant)
      })
    }

    // Set the block status.
    algorithm(blocked)
  }

  // Implemented
  public modifySuccessChance(
    successChanceOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifySuccessChance(successChanceOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifySuccessChance(successChanceOperand)
    }

    // Emit event.
    this.emitEvent('modify-actions')
  }

  // Implemented
  public modifyProcessTime(
    processTimeOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifyProcessTime(processTimeOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifyProcessTime(processTimeOperand)
    }

    // Emit event.
    this.emitEvent('modify-actions')
  }

  // Implemented
  public modifyResourceCost(
    resourceCostOperand: number,
    actionId?: string,
  ): void {
    if (!actionId) {
      this.actions.forEach((action) => {
        action.modifyResourceCost(resourceCostOperand)
      })
    } else {
      const action = this.actions.get(actionId)
      if (!action) throw new Error(`Action "${actionId}" not found.`)
      action.modifyResourceCost(resourceCostOperand)
    }

    // Emit event.
    this.emitEvent('modify-actions')
  }

  /**
   * This will color all descendant nodes the same color as this node.
   */
  public applyColorFill(): void {
    for (let childNode of this.children) {
      childNode.color = this.color
      childNode.emitEvent('set-color')
      childNode.applyColorFill()
    }
  }

  /**
   * Populates the node's descendants, if not already populated.
   * @param data The descendant data to populate with.
   */
  protected populateDescendants(data: TMissionNodeJson[]): void {
    // If the descendants are already set,
    // don't set them again.
    if (this.descendants.length > 0) return

    // Generate descendants.
    data.forEach((datum) => {
      // Create a new node.
      let descendant = new ClientMissionNode(this.force, datum)
      // Add the node into the force.
      this.force.nodes.push(descendant)
    })
  }

  /**
   * Duplicates the node, creating a new node with the same properties
   * as this one or with the provided properties.
   * @param options The options for the duplication.
   * @param options.force The force of the new node.
   * @param options.name The name of the new node.
   * @param options.localKey The local key of the new node.
   * @returns A new node with the same properties as this one or with the
   * provided properties.
   */
  public duplicate(options: TDuplicateNodeOptions = {}): ClientMissionNode {
    // Gather details.
    const {
      name = this.name,
      force = this.force,
      localKey = this.localKey,
    } = options

    let duplicatedNode = new ClientMissionNode(force, {
      name,
      localKey,
      _id: ClientMissionNode.DEFAULT_PROPERTIES._id,
      prototypeId: this.prototype._id,
      color: this.color,
      description: this.description,
      preExecutionText: this.preExecutionText,
      executable: this.executable,
      device: this.device,
      actions: [],
      opened: this.opened,
      blocked: this.blocked,
      executions: this.executions,
      exclude: this.exclude,
    })

    // Duplicate the actions.
    this.actions.forEach((action) => {
      let duplicatedAction = action.duplicate({ node: duplicatedNode })
      duplicatedNode.actions.set(duplicatedAction._id, duplicatedAction)
    })

    return duplicatedNode
  }

  /* -- static -- */

  /**
   * The relative width of a node on the mission map.
   */
  public static readonly WIDTH = 2.25 //em

  /**
   * The relative width of an excluded node on the mission map.
   */
  public static readonly EXCLUDED_WIDTH = 0.45 //em

  /**
   * The vertical padding of a node on the mission map.
   */
  public static readonly VERTICAL_PADDING = 0.15 //em
  /**
   * The relative width of a column of nodes on the mission map.
   */
  public static readonly COLUMN_WIDTH = 3 //em
  /**
   * The relative height of a row of nodes on the mission map.
   */
  public static readonly ROW_HEIGHT = 1.25 //em
  /**
   * The height of the buttons for a node on the mission map.
   */
  public static readonly BUTTONS_HEIGHT = 0.425 //em
  /**
   * The size of the font for the node name on the mission map.
   */
  public static readonly FONT_SIZE = 0.15 //em
  /**
   * The ratio of the font height to the font width.
   */
  public static readonly FONT_RATIO = 1.6592592593
  /**
   * The line height of the node name on the mission map.
   */
  public static readonly LINE_HEIGHT = 0.19 / ClientMissionNode.FONT_SIZE //em
  /**
   * The default number of lines of text to display for the node
   * name on the mission map.
   */
  public static readonly DEFAULT_NAME_LINE_COUNT = 2
  /**
   * The default height needed to display the node name on the mission map.
   */
  public static readonly DEFAULT_NAME_NEEDED_HEIGHT =
    ClientMissionNode.LINE_HEIGHT *
    ClientMissionNode.FONT_SIZE *
    ClientMissionNode.DEFAULT_NAME_LINE_COUNT
  /**
   * The excess height used to display the node name on the mission map.
   */

  /**
   * The width of the node's name relative to the node's width.
   */
  public static readonly NAME_WIDTH_RATIO = 0.675
  /**
   * The number of characters that can fit on a single line of the node's name.
   */
  public static readonly CHARACTERS_PER_LINE = Math.floor(
    ((ClientMissionNode.WIDTH * ClientMissionNode.NAME_WIDTH_RATIO) /
      ClientMissionNode.FONT_SIZE) *
      ClientMissionNode.FONT_RATIO,
  )
}

/* ------------------------------ CLIENT NODE TYPES ------------------------------ */

/**
 * An event that occurs on a node, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'exec-state-change'
 * Triggered when the following occurs:
 * - An execution is initiated on the server.
 * - An execution outcome is received from the server.
 * @option 'request-made'
 * Triggered when the following occurs:
 * - A node is requested to be opened by the client and is awaiting a response from the server.
 * - An action is requested to be executed by the client and is awaiting a response from the server.
 * - A message is requested to be sent to the output panel by the client and is awaiting a response from the server.
 * @option 'request-failed'
 * Triggered when the following occurs:
 * - A node is requested to be opened by the client and the server fails to open the node.
 * - An action is requested to be executed by the client and the server fails to execute the action.
 * @option 'open'
 * Triggered when the node is opened.
 * @option 'set-buttons'
 * Triggered when the buttons for the node are set.
 * @option 'set-blocked'
 * Triggered when the following occurs:
 * - The node is blocked.
 * - The node is unblocked.
 * @option 'modify-actions'
 * Triggered when the following occurs:
 * - The success chance of the node's actions are modified.
 * - The process time of the node's actions are modified.
 * - The resource cost of the node's actions are modified.
 * @option 'output-sent'
 * - Triggered when a message has been sent to the output panel.
 */
export type TNodeEventMethod =
  | TMapCompatibleNodeEvent
  | 'request-made'
  | 'request-failed'
  | 'open'
  | 'modify-actions'
  | 'output-sent'

/**
 * The options for duplicating a node.
 * @see {@link ClientMissionNode.duplicate}
 */
type TDuplicateNodeOptions = {
  /**
   * The force to which the duplicated node belongs.
   */
  force?: ClientMissionForce
  /**
   * The name of the duplicated node.
   */
  name?: string
  /**
   * The local key of the duplicated node.
   */
  localKey?: string
}
