import axios, { AxiosResponse } from 'axios'
import Mission, {
  IMissionJSON,
  ISpawnNodeOptions,
  TMissionOptions,
} from '../../../shared/missions'
import { TMissionNodeJSON } from '../../../shared/missions/nodes'
import ClientMissionNode, { ENodeTargetRelation } from './nodes'
import { v4 as generateHash } from 'uuid'
import { Counter } from '../../../shared/toolbox/numbers'
import NodeCreator from './nodes/creator'
import { Vector2D } from '../../../shared/toolbox/space'
import { TLine_P } from 'src/components/content/game/mission-map/objects/Line'
import { TWithKey } from '../../../shared/toolbox/objects'

/**
 * Class for managing missions on the client.
 * @extends {Mission<ClientMissionNode>}
 */
export default class ClientMission extends Mission<ClientMissionNode> {
  /**
   * Whether the resource exists on the server.
   */
  protected _existsOnServer: boolean
  /**
   * Whether the resource exists on the server.
   */
  public get existsOnServer(): boolean {
    return this._existsOnServer
  }

  /**
   * The depth of the missions node structure.
   */
  protected _depth: number
  /**
   * The depth of the missions node structure.
   */
  public get depth(): number {
    return this._depth
  }

  /**
   * A key for tracking state changes in the mission's structure.
   */
  protected _structureChangeKey: string
  /**
   * A key for tracking state changes in the mission's structure.
   */
  public get structureChangeKey(): string {
    return this._structureChangeKey
  }

  /**
   * Whether the structure of the mission has been initialized.
   */
  protected structureInitialized: boolean = false

  /**
   * Listeners for mission events.
   */
  private listeners: Array<[TMissionEvent, () => void]> = []

  /**
   * The last created node for the mission.
   */
  public lastCreatedNode: ClientMissionNode | null

  /**
   * Cache for tracking a node, around which a new node will be created.
   */
  protected _nodeCreationTarget: ClientMissionNode | null
  /**
   * Cache for tracking a node, around which a new node will be created.
   */
  public get nodeCreationTarget(): ClientMissionNode | null {
    return this._nodeCreationTarget
  }
  public set nodeCreationTarget(nodeCreationTarget: ClientMissionNode | null) {
    this._nodeCreationTarget = nodeCreationTarget
    this._nodeCreators = []

    if (nodeCreationTarget !== null) {
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.ParentOfTargetOnly,
          new Vector2D(0, 0),
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.BetweenTargetAndChildren,
          new Vector2D(0, 0),
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.PreviousSiblingOfTarget,
          new Vector2D(0, 0),
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.FollowingSiblingOfTarget,
          new Vector2D(0, 0),
        ),
      )
    }

    this.handleStructureChange()
  }

  /**
   * Cache for tracking possible locations for creating a new node based on the node creation target.
   */
  protected _nodeCreators: Array<NodeCreator>
  /**
   * Cache for tracking possible locations for creating a new node based on the node creation target.
   */
  public get nodeCreators(): Array<NodeCreator> {
    return this._nodeCreators
  }

  /**
   * Tracks the last opened node on the mission. Updated by the ClientMissionNode.open method.
   */
  public lastOpenedNode: ClientMissionNode | null

  /**
   * The lines used to draw relationships between nodes on a mission map.
   * @note Calculated in `ClientMissionNode.drawRelationshipLines`.
   */
  public relationshipLines: TWithKey<TLine_P>[]

  public constructor(
    data: Partial<IMissionJSON> = {},
    options: TClientMissionOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)

    // Parse client-specific options.
    let { existsOnServer = false } = options

    // Initialize client-specific properties.
    this._existsOnServer = existsOnServer
    this._depth = -1
    this._structureChangeKey = generateHash()
    this.lastCreatedNode = null
    this._nodeCreationTarget = null
    this._nodeCreators = []
    this.relationshipLines = []
    this.lastOpenedNode = null

    // If there is no existing nodes,
    // create one.
    if (this.nodes.length === 0) {
      this.spawnNode()
    }

    // Mark as initialized.
    this.structureInitialized = true

    // Initialize structure.
    this.handleStructureChange()
  }

  // Inherited
  protected createRootNode(): ClientMissionNode {
    return new ClientMissionNode(this, Mission.ROOT_NODE_PROPERTIES)
  }

  /**
   * Handles a change in the mission's structure, anything that
   * would change the structure of the mission's node tree.
   */
  public handleStructureChange(): void {
    // Do not handle structure changes
    // until the structure is properly
    // initialized by the constructor.
    if (!this.structureInitialized) {
      return
    }

    // Update the key for tracking
    // changes.
    this._structureChangeKey = generateHash()

    // Re-position the nodes to ensure
    // their current positions reflect
    // all the changes that have been
    // made.
    this.positionNodes()

    // Re-position the node creators
    // to ensure their current positions
    // reflect all the changes that have
    // been made.
    if (this.nodeCreationTarget !== null) {
      this.positionNodeCreators()
    }

    // Draw the relationship lines
    // between nodes.
    this.drawRelationshipLines()

    // Emit the structure change event.
    this.emitEvent('structure-change')
  }

  /**
   * Calls the callbacks of listeners for the given mission event.
   * @param event The event emitted.
   */
  protected emitEvent(event: TMissionEvent): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === event || listenerEvent === 'activity') {
        listenerCallback()
      }
    }
  }

  /**
   * Adds a listener for a mission event.
   * @param event The event for which to listen.
   * @param callback The callback to call when the event is triggered.
   */
  public addEventListener(event: TMissionEvent, callback: () => void): void {
    this.listeners.push([event, callback])
  }

  /**
   * Removes a listener for a mission event.
   * @param callback The callback used for the listener.
   */
  public removeEventListener(callback: () => void): void {
    // Filter out listener.
    this.listeners = this.listeners.filter(([, h]) => h !== callback)
  }

  /**
   * This will position all the nodes with mapX and mapY values
   * that correspond with the current state of the mission.
   * @param parentNode Recursively used. Don't pass anything.
   * @param depth Recursively used. Don't pass anything.
   * @param rowCount Recursively used. Don't pass anything.
   * @param extraLines Recursively used. Don't pass anything.
   * @param rowMostLinesFound Recursively used. Don't pass anything.
   * @returns Subcalls of this recursive function will return results used for
   * further position calculations. The final return can be ignored.
   */
  protected positionNodes = (
    parentNode: ClientMissionNode = this.rootNode,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
    extraLines: Counter = new Counter(0),
    rowMostLinesFound: Counter = new Counter(0),
  ): void => {
    let nodeCreationTarget: ClientMissionNode | null = this.nodeCreationTarget

    let yOffset: number =
      extraLines.count *
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE

    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parentNode.nodeID !== this.rootNode.nodeID) {
      parentNode.position.set(
        depth * ClientMissionNode.COLUMN_WIDTH,
        rowCount.count * ClientMissionNode.ROW_HEIGHT + yOffset,
      )
    }
    // Else the depth of the mission is reset
    // for recalculation.
    else {
      this._depth = -1
    }

    // Set the depth of the parent node.
    parentNode.depth = depth

    // If the nodeCreationTarget is this parentNode,
    // the positioning is offset to account for the
    // node creators that must be rendered.
    if (nodeCreationTarget?.nodeID === parentNode.nodeID) {
      depth++
    }

    let childNodes = parentNode.childNodes

    // If the nodeCreationTarget is a child of the
    // parentNode, the positioning is offset to account
    // for the node creators that must be rendered.
    for (let childNode of childNodes) {
      if (nodeCreationTarget?.nodeID === childNode.nodeID) {
        depth += 1
      }
    }

    // Set the most lines found for the row
    // to the row count of this node, unless
    // the previous value is greater.
    rowMostLinesFound.count = Math.max(
      rowMostLinesFound.count,
      parentNode.nameLineCount,
    )

    // The childNodes should then be examined
    // by recursively calling this function.
    childNodes.forEach((childNode: ClientMissionNode, index: number) => {
      if (index > 0) {
        rowCount.increment()
        extraLines.count += Math.max(
          0,
          rowMostLinesFound.count - ClientMissionNode.DEFAULT_NAME_LINE_COUNT,
        )
        rowMostLinesFound.count = 0
      }

      // If the nodeCreationTarget is this childNode,
      // the positioning is offset to account for the
      // node creators that must be rendered.
      if (nodeCreationTarget?.nodeID === childNode.nodeID) {
        rowCount.increment()
      }

      // Position the child node.
      this.positionNodes(
        childNode,
        depth + 1 + childNode.depthPadding,
        rowCount,
        extraLines,
        rowMostLinesFound,
      )

      // If the nodeCreationTarget is this childNode,
      // the positioning is offset to account for the
      // node creators that must be rendered.
      if (nodeCreationTarget?.nodeID === childNode.nodeID) {
        rowCount.increment()
      }
    })

    // This will increase the mission depth
    // if a node is found with a greater depth
    // than what's currently set.
    if (this._depth < depth) {
      this._depth = depth
    }
  }

  /**
   * This will position all the nodes creators with mapX and mapY
   * values that correspond with the current state of the mission.
   */
  protected positionNodeCreators = (): void => {
    let nodeCreationTarget: ClientMissionNode | null = this.nodeCreationTarget
    let nodeCreators: Array<NodeCreator> = this.nodeCreators

    if (nodeCreationTarget !== null) {
      for (let nodeCreator of nodeCreators) {
        switch (nodeCreator.creationTargetRelation) {
          case ENodeTargetRelation.ParentOfTargetAndChildren:
            nodeCreator.position.translateX(-2)
            nodeCreator.depth = nodeCreationTarget.depth - 2
            break
          case ENodeTargetRelation.ParentOfTargetOnly:
            nodeCreator.position.translateX(-1)
            nodeCreator.depth = nodeCreationTarget.depth - 1
            break
          case ENodeTargetRelation.BetweenTargetAndChildren:
            nodeCreator.position.translateX(1)
            nodeCreator.depth = nodeCreationTarget.depth + 1
            break
          case ENodeTargetRelation.PreviousSiblingOfTarget:
            nodeCreator.position.translateY(-1)
            nodeCreator.depth = nodeCreationTarget.depth
            break
          case ENodeTargetRelation.FollowingSiblingOfTarget:
            nodeCreator.position.translateY(1)
            nodeCreator.depth = nodeCreationTarget.depth
            break
        }
      }
    }
  }

  /**
   * Draws the relationship lines between nodes on the mission map
   * and caches them in the `relationshipLines` property.
   */
  protected drawRelationshipLines(): void {
    // The relationship lines drawn.
    let relationshipLines: TWithKey<TLine_P>[] = []
    // Define the distance between the edge of a
    // node and the edge of the column.
    let columnEdgeDistance: number =
      (ClientMissionNode.COLUMN_WIDTH - ClientMissionNode.WIDTH) / 2

    // Recursive algorithm used to determine the
    // relationship lines between nodes.
    const algorithm = (parent: ClientMissionNode = this.rootNode) => {
      // Get details.
      const halfDefaultNodeHeight: number =
        ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT / 2 +
        ClientMissionNode.VERTICAL_PADDING
      let children: ClientMissionNode[] = parent.childNodes
      let childCount: number = children.length

      // If the parent is not the invisible root node
      // in the mission and the parent has children,
      // then a relationship line should be drawn
      // between the parent and the edge of the
      // column.
      if (parent !== this.rootNode && childCount > 0) {
        // Clone the parent node's position then translate
        // the start position to the middle of the right edge of
        // the parent node.
        let parentToMidStart: Vector2D = parent.position
          .clone()
          .translateX(ClientMissionNode.WIDTH / 2)
          .translateY(halfDefaultNodeHeight)

        // Push a new line.
        relationshipLines.push({
          key: `parent-to-middle_${parent.nodeID}`,
          direction: 'horizontal',
          start: parentToMidStart,
          // The length of the line is the distance
          // between the edge of the parent node and
          // the edge of the column.
          length: columnEdgeDistance,
        })

        // If there is more than one node, create a vertcial line
        // down the middle of the edge of the column to connect to
        // each child node.
        if (childCount > 1) {
          // Determine the start position of the vertical line.
          let downMidStart = parentToMidStart
            .clone()
            .translateX(columnEdgeDistance)
          let lastChildY: number =
            children[childCount - 1].position.y + halfDefaultNodeHeight
          let downMidLength: number = lastChildY - downMidStart.y

          relationshipLines.push({
            key: `down-middle_${parent.nodeID}`,
            direction: 'vertical',
            start: downMidStart,
            length: downMidLength,
          })
        }

        // Iterate through the children.
        for (let child of children) {
          // Draw a line from the edge of the column to the
          // middle of the left edge of the child node.

          // First, clone the child node's position then
          // translate the start position to the column edge.
          let midToChildStart: Vector2D = child.position
            .clone()
            .translateX(-ClientMissionNode.WIDTH / 2 - columnEdgeDistance)
            .translateY(halfDefaultNodeHeight)

          // Push the new line.
          relationshipLines.push({
            key: `middle-to-child_${child.nodeID}`,
            direction: 'horizontal',
            start: midToChildStart,
            // The length of the line is the distance
            // between the edge of the column and
            // the edge of the child node.
            length: columnEdgeDistance,
          })
        }
      }

      // Iterate through the child nodes.
      for (let child of parent.childNodes) {
        // Call recursively the algorithm with
        // the child.
        algorithm(child)
      }
    }

    // Run the algorithm.
    algorithm()

    // Set the relationship lines in the mission to
    // those determined by the algorithm.
    this.relationshipLines = relationshipLines
  }

  // Implemented
  public spawnNode(
    data: Partial<TMissionNodeJSON> = {},
    options: ISpawnNodeOptions<ClientMissionNode> = {},
  ): ClientMissionNode {
    let { addToNodeMap = true, makeChildOfRoot = true } = options
    let rootNode: ClientMissionNode = this.rootNode

    // Create new node.
    let node: ClientMissionNode = new ClientMissionNode(this, data, options)

    // Handle makeChildOfRoot option.
    if (makeChildOfRoot) {
      // Set the parent node to the root
      // node.
      node.parentNode = rootNode
      // Add the node to the root node's
      // children.
      rootNode.childNodes.push(node)
    }
    // Handle addToNodeMap option.
    if (addToNodeMap) {
      // Add the node to the node map.
      this.nodes.push(node)
    }

    // Set last created node.
    this.lastCreatedNode = node

    // Handle structure change.
    this.handleStructureChange()

    // Return the node.
    return node
  }

  /**
   * Commit any changes made and save them to the server. Calls
   * @note Chooses between post and put based on the state of the `existsOnServer`
   * property. This can be set as an option in the constructor.
   * @returns Promise<void> A promise that resolves when the operation is complete.
   */
  public async saveToServer(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Create a new mission if it doesn't
        // exist already.
        if (!this.existsOnServer) {
          let { data } = await axios.post<any, AxiosResponse<IMissionJSON>>(
            ClientMission.API_ENDPOINT,
            this.toJSON(),
          )
          // Update the temporary client-generated
          // mission ID and seed with the server-generated
          // mission ID and seed.
          this.missionID = data.missionID
          this.seed = data.seed
          // Update existsOnServer to true.
          this._existsOnServer = true
        }
        // Update the mission if it does exist.
        else {
          await axios.put(ClientMission.API_ENDPOINT, this.toJSON())
        }
        resolve()
      } catch (error) {
        console.error('Failed to save mission.')
        console.error(error)
        reject()
      }
    })
  }

  /* -- API -- */

  /**
   * The API endpoint for mission data on the METIS server.
   */
  public static API_ENDPOINT: string = `/api/v1/missions`

  /* -- API | CREATE -- */

  /**
   * Imports missions from .metis files, returns a Promise that resolves with the results of the import.
   * @param {FileList | Array<File>} files The .metis files to import.
   * @returns {Promise<TMissionImportResult>} The result of the import.
   */
  public static async import(
    files: FileList | Array<File>,
  ): Promise<TMissionImportResult> {
    return new Promise<TMissionImportResult>(async (resolve, reject) => {
      try {
        const formData = new FormData()

        for (let file of files) {
          formData.append('files', file)
        }

        let { data: result } = await axios.post<
          any,
          AxiosResponse<TMissionImportResult>
        >(`/api/v1/missions/import/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        resolve(result)
      } catch (error) {
        console.error('Failed to import mission(s).')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Copy a mission and create a new mission with the same structure.
   * @param originalID The ID of the mission to copy.
   * @param copyName The name for the mission copy.
   * @param options Options for the creation of the Mission object returned.
   * @returns A promise that resolves to a ClientMission object for the new mission copy.
   */
  public static async copy(
    originalID: string,
    copyName: string,
    options: TExistingClientMissionOptions = {},
  ): Promise<ClientMission> {
    return new Promise<ClientMission>(async (resolve, reject) => {
      try {
        let { data } = await axios.put<any, AxiosResponse<IMissionJSON>>(
          `${ClientMission.API_ENDPOINT}/copy/`,
          {
            originalID,
            copyName,
          },
        )
        options.existsOnServer = true
        resolve(new ClientMission(data, options))
      } catch (error) {
        console.error('Failed to copy mission.')
        console.error(error)
        reject(error)
      }
    })
  }

  /* -- API | READ -- */

  /**
   * Calls the API to fetch one mission by its mission ID.
   * @param {string} missionID The ID of the mission to fetch.
   * @param {object} options Options for the creation of the Mission object returned.
   * @returns {Promise<ClientMission>} A promise that resolves to a Mission object.
   */
  public static async fetchOne(
    missionID: string,
    options: TExistingClientMissionOptions = {},
  ): Promise<ClientMission> {
    return new Promise<ClientMission>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data } = await axios.get<IMissionJSON>(
          ClientMission.API_ENDPOINT,
          { params: { missionID } },
        )
        // Update options.
        options.existsOnServer = true
        // Convert JSON to ClientMission object.
        let mission: ClientMission = new ClientMission(data, options)
        // Resolve
        resolve(mission)
      } catch (error) {
        console.error('Failed to fetch mission.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all missions available.
   * @param {TMissionOptions} options Options for the creation of the Mission objects returned.
   * @returns {Promise<Array<ClientMission>>} A promise that resolves to an array of Mission objects.
   */
  public static async fetchAll(
    options: TExistingClientMissionOptions = {},
  ): Promise<Array<ClientMission>> {
    return new Promise<Array<ClientMission>>(async (resolve, reject) => {
      try {
        let { data } = await axios.get<Array<IMissionJSON>>(
          ClientMission.API_ENDPOINT,
        )
        // Update options.
        options.existsOnServer = true
        // Convert JSON to ClientMission objects.
        resolve(data.map((datum) => new ClientMission(datum, options)))
      } catch (error) {
        console.error('Failed to fetch missions.')
        console.error(error)
        reject(error)
      }
    })
  }

  /* -- API | UPDATE -- */

  /**
   * The will update the mission's live property in the database. Changing
   * the live property will determine whether the mission is available to
   * launch into a game.
   * @param {string} missionID The ID of the mission to update.
   * @param {boolean} live Whether the mission should be live.
   * @returns {Promise<void>} A promise that resolves when the mission has been updated.
   */
  public static async setLive(missionID: string, live: boolean): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.put(ClientMission.API_ENDPOINT, {
          missionID,
          live,
        })
        resolve()
      } catch (error) {
        console.error('Failed to change mission live state.')
        console.error(error)
        reject(error)
      }
    })
  }

  /* -- API | DELETE -- */

  /**
   * Deletes the mission with the given ID.
   * @param {string} missionID The ID of the mission to delete.
   * @returns {Promise<void>} A promise that resolves when the mission has been deleted.
   */
  public static async delete(missionID: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.delete(ClientMission.API_ENDPOINT, {
          params: { missionID: missionID },
        })
        resolve()
      } catch (error) {
        console.error('Failed to delete mission.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/**
 * Options for the creation of a ClientMission object.
 */
export type TClientMissionOptions = TMissionOptions & {
  /**
   * Whether the data already exists on the server.
   * @default false
   */
  existsOnServer?: boolean
}

/**
 * Options for the creation of a ClientMission object when the mission is known to exist on the server.
 */
export type TExistingClientMissionOptions = TClientMissionOptions & {
  /**
   * Overrides the existsOnServer option from `TClientMissionOptions` to true.
   * @default true
   */
  existsOnServer?: true
}

/**
 * Results of a mission import via the ClientMission.importMissions method.
 */
export type TMissionImportResult = {
  /**
   * The number of missions successfully imported.
   */
  successfulImportCount: number
  /**
   * The number of missions that failed to import.
   */
  failedImportCount: number
  /**
   * The error messages and file names for the missions that failed to import.
   */
  errorMessages: Array<{ fileName: string; errorMessage: string }>
}

/**
 * A function that handles a change in the mission's structure.
 */
export type TStructureChangeListener = (structureChangeKey: string) => void

/**
 * An event that occurs on a node, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'structure-change'
 * Triggered when the structure of the mission, including the nodes and actions
 * that make up the mission, change.
 */
export type TMissionEvent = 'activity' | 'structure-change'
