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
   * Listener functions that are called when the structure changes.
   */
  protected structureListeners: Array<TStructureChangeListener>

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
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.BetweenTargetAndChildren,
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.PreviousSiblingOfTarget,
          0,
          0,
        ),
      )
      this._nodeCreators.push(
        new NodeCreator(
          this,
          nodeCreationTarget,
          ENodeTargetRelation.FollowingSiblingOfTarget,
          0,
          0,
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
    this.structureListeners = []
    this.lastCreatedNode = null
    this._nodeCreationTarget = null
    this._nodeCreators = []
    this.lastOpenedNode = null

    // If there is no existing nodes,
    // create one.
    if (this.nodes.size === 0) {
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

    // Call listener functions so that
    // external componenets can respond
    // to the structure change.
    for (let listener of this.structureListeners) {
      listener(this.structureChangeKey)
    }
  }

  /**
   * Adds a listener function that is called when a change has been
   * made to the structure of the mission.
   * @param listener The listener function.
   */
  public addStructureListener(
    listener: (structureChangeKey: string) => void,
  ): void {
    this.structureListeners.push(listener)
  }

  /**
   *  Removes an existing structure listener.
   * @param listener The listener to remove.
   */
  public removeStructureListener(
    listener: (structureChangeKey: string) => void,
  ): void {
    this.structureListeners.splice(this.structureListeners.indexOf(listener), 1)
  }

  /**
   * Clears any and all structure listeners currently active.
   */
  public clearStructureListeners(): void {
    this.structureListeners = []
  }

  /**
   * This will position all the nodes with mapX and mapY values
   * that correspond with the current state of the mission.
   * @param parentNode Recursively used. Don't pass anything.
   * @param depth Recursively used. Don't pass anything.
   * @param rowCount Recursively used. Don't pass anything.
   * @returns {Mission} The mission.
   */
  protected positionNodes = (
    parentNode: ClientMissionNode = this.rootNode,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): ClientMission => {
    let nodeCreationTarget: ClientMissionNode | null = this.nodeCreationTarget

    // If the parent node isn't the rootNode,
    // then this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the
    //  missionRender so that it displays.
    if (parentNode.nodeID !== this.rootNode.nodeID) {
      parentNode.mapX = depth
      parentNode.mapY = rowCount.count
    }
    // Else the depth of the mission is reset
    // for recalculation.
    else {
      this._depth = -1
    }

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

    // The childNodes should then be examined
    // by recursively calling this function.
    childNodes.forEach((childNode: ClientMissionNode, index: number) => {
      if (index > 0) {
        rowCount.increment()
      }

      // If the nodeCreationTarget is this childNode,
      // the positioning is offset to account for the
      // node creators that must be rendered.
      if (nodeCreationTarget?.nodeID === childNode.nodeID) {
        rowCount.increment()
      }

      this.positionNodes(
        childNode,
        depth + 1 + childNode.depthPadding,
        rowCount,
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

    return this
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
            nodeCreator.mapX = nodeCreationTarget.mapX - 2
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth - 2
            break
          case ENodeTargetRelation.ParentOfTargetOnly:
            nodeCreator.mapX = nodeCreationTarget.mapX - 1
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth - 1
            break
          case ENodeTargetRelation.BetweenTargetAndChildren:
            nodeCreator.mapX = nodeCreationTarget.mapX + 1
            nodeCreator.mapY = nodeCreationTarget.mapY
            nodeCreator.depth = nodeCreationTarget.depth + 1
            break
          case ENodeTargetRelation.PreviousSiblingOfTarget:
            nodeCreator.mapX = nodeCreationTarget.mapX
            nodeCreator.mapY = nodeCreationTarget.mapY - 1
            nodeCreator.depth = nodeCreationTarget.depth
            break
          case ENodeTargetRelation.FollowingSiblingOfTarget:
            nodeCreator.mapX = nodeCreationTarget.mapX
            nodeCreator.mapY = nodeCreationTarget.mapY + 1
            nodeCreator.depth = nodeCreationTarget.depth
            break
        }
      }
    }
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
      this.nodes.set(node.nodeID, node)
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
