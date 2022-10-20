import NodeStructureReference from './node-reference'
import { Counter, isInteger } from './numbers'
import { cloneDeep } from 'lodash'
import { AnyObject } from 'mongoose'
import seedrandom, { PRNG } from 'seedrandom'

// This is the raw mission data returned
// from the server used to create instances
// of the Mission class.
export interface IMissionJson {
  name: string
  versionNumber: number
  seed: number
  nodeStructure: object
  nodeData: object
}

// This is the raw node data returned
// from the server used to create instances
// of MissionNode in the Mission class.
export interface IMissionNodeJson {
  executing: boolean
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  nodeActionItems: Array<{
    text: string
    timeDelay: number
    successChance: number
  }>
  successChance: number
}

// These are options available to
// some using the renderMission function
// in the Mission class.
export interface IMissionRenderOptions {
  // This will ignore whether a node is
  // expanded or collapsed and render
  // everything regardless.
  ignoreVisibility?: boolean
}

// This represents an individual node
// for a student to execute within a
// mission.
export class MissionNode {
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  nodeActionItems: Array<{
    text: string
    timeDelay: number
    successChance: number
  }>
  selectedNodeAction: string | null
  executionTimeSpan: number | null
  _executed: boolean
  _executing: boolean
  successChance: number | null
  _willSucceed: boolean
  mapX: number
  mapY: number

  get willSucceed(): boolean {
    return this._willSucceed
  }

  get executed(): boolean {
    return this._executed
  }

  get succeeded(): boolean {
    return this._executed && this._willSucceed
  }

  get executing(): boolean {
    return this._executing
  }

  constructor(
    nodeID: string,
    name: string,
    color: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    executable: boolean,
    nodeActionItems: Array<{
      text: string
      timeDelay: number
      successChance: number
    }>,
    successChance: number,
    willSucceed: boolean,
    mapX: number,
    mapY: number,
  ) {
    this.nodeID = nodeID
    this.name = name
    this.color = color
    this.preExecutionText = preExecutionText
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.actionData = actionData
    this.executable = executable
    this.nodeActionItems = nodeActionItems
    this.selectedNodeAction = null
    this.executionTimeSpan = null
    this._executed = false
    this._executing = false
    this.successChance = null
    this._willSucceed = false
    this.mapX = mapX
    this.mapY = mapY
  }

  isExecuting(): boolean {
    if (this.executable === true && this.executed === false) {
      this._executing = true
    } else if (this.executable === true && this.executed === true) {
      this._executing = false
    }
    return this._executing
  }

  // This will execute the node if it
  // is executable and then return
  // whether the node was successfully
  // executed or not.
  execute(): boolean {
    if (this.executable) {
      this._executed = true
    }
    return this._executed && this._willSucceed
  }
}

// This represents a mission for a
// student to complete.
export class Mission {
  name: string
  versionNumber: number
  nodeStructure: object
  nodeData: Map<string, MissionNode>
  seed: number

  constructor(
    name: string,
    versionNumber: number,
    nodeStructure: object,
    nodeData: Map<string, MissionNode>,
    seed: number,
  ) {
    this.name = name
    this.versionNumber = versionNumber
    this.nodeStructure = nodeStructure
    this.nodeData = nodeData
    this.seed = seed
  }

  // This will determine whether a
  // node succeeds or fails based
  // on the success chance passed.
  static determineNodeSuccess = (successChance: number, rng: PRNG): boolean => {
    return rng.double() <= successChance
  }

  // This will create a new Mission
  // object from the JSON data returned
  // from the server.
  static fromJson(json: IMissionJson): Mission {
    try {
      // Define variables, grabbing needed
      // data from the JSON passed.
      let mission: Mission
      let name: string = json.name
      let versionNumber: number = json.versionNumber
      let seed: number = json.seed
      let nodeStructure: object = json.nodeStructure
      let nodeDataJson: object = json.nodeData
      let nodeData: Map<string, MissionNode> = new Map<string, MissionNode>()
      let nodeDataKeys: string[] = Object.keys(nodeDataJson)

      // Throws error if versionNumber is
      // not an integer.
      if (!isInteger(versionNumber)) {
        throw new Error()
      }

      // Set seed for random so that we get
      // the same success/failure results
      // for the nodes in this mission as other
      // students taking this mission.
      let rng = seedrandom(`${seed}`)

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let key of nodeDataKeys) {
        let nodeDatum: IMissionNodeJson = (nodeDataJson as any)[key]

        let node: MissionNode = new MissionNode(
          nodeDatum.nodeID,
          nodeDatum.name,
          nodeDatum.color,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.actionData,
          nodeDatum.executable,
          nodeDatum.nodeActionItems,
          nodeDatum.successChance,
          Mission.determineNodeSuccess(nodeDatum.successChance, rng),
          0,
          0,
        )

        nodeData.set(key, node)
      }

      // Create mission object and return it.
      mission = new Mission(name, versionNumber, nodeStructure, nodeData, seed)
      return mission
    } catch (error) {
      console.error('Invalid JSON passed to create Mission object.')
      throw error
    }
  }

  // This will construct a new mission
  // based on the original mission and
  // a node structure reference that represents
  // that mission. The node structure reference
  // will be read to determine all the currently
  // expanded and collapsed nodes, rendering a
  // mission that only display the nodes that
  // have been expanded into view.
  static renderMission = (
    originalMission: Mission,
    nodeStructureReference: NodeStructureReference,
    nodeStructure: AnyObject,
    options: IMissionRenderOptions = {},
    missionRender: Mission | null = null,
    depth: number = -1,
    rowCount: Counter = new Counter(0),
  ): Mission => {
    // If mission render is null,
    // then this should be the functions
    // initial call before any recursion.
    // Therefore the missionRender should
    // be initialized.
    if (missionRender === null) {
      missionRender = new Mission(
        originalMission.name,
        originalMission.versionNumber,
        cloneDeep(originalMission.nodeStructure),
        new Map<string, MissionNode>(),
        originalMission.seed,
      )
      nodeStructure = missionRender.nodeStructure
    }
    // Else, this function was recursively
    // called with a reference to a particular
    // node in the mission. This node should be
    // included in the nodeData for the missionRender
    // so that it displays.
    else {
      let nodeID: string = nodeStructureReference.nodeID
      let nodeDatum: MissionNode | undefined =
        originalMission.nodeData.get(nodeID)

      if (nodeDatum !== undefined) {
        nodeDatum.mapX = depth
        nodeDatum.mapY = rowCount.count
        missionRender.nodeData.set(nodeID, nodeDatum)
      } else {
        console.error(
          new Error(
            `Cannot render mission since the nodeDatum with the ID ${nodeID} could not be found in the original mission:`,
          ),
        )
        return new Mission(
          originalMission.name,
          originalMission.versionNumber,
          {},
          new Map<string, MissionNode>(),
          originalMission.seed,
        )
      }
    }

    let subnodes = nodeStructureReference.subnodes
    // If the current node being examined is
    // collapsed, then this recursive function
    // should not dig deeper, and the render is
    // returned up the chain.
    if (!options.ignoreVisibility && nodeStructureReference.isCollapsed) {
      for (let key of Object.keys(nodeStructure)) {
        delete nodeStructure[key]
      }
      return missionRender
    }
    // Else, the node is expanded, the subnodes
    // should then be examined by recursively
    // calling this function.
    else {
      subnodes.forEach((subnode: NodeStructureReference, index: number) => {
        if (!(subnode.nodeID in nodeStructure)) {
          console.error(
            new Error(
              `Cannot render mission since the nodeReference subnode ${subnode.nodeID} cannot be found in nodeStructure:`,
            ),
          )
          return new Mission(
            originalMission.name,
            originalMission.versionNumber,
            {},
            new Map<string, MissionNode>(),
            originalMission.seed,
          )
        }

        let substructure: AnyObject = nodeStructure[subnode.nodeID]

        if (index > 0) {
          rowCount.increment()
        }

        Mission.renderMission(
          originalMission,
          subnode,
          substructure,
          options,
          missionRender,
          depth + 1,
          rowCount,
        )
      })
    }

    return missionRender
  }
}

// ! TO-BE-REMOVED
// This creates a test mission for
// testing purposes.
export function createTestMission(): Mission {
  const testMissionJson: IMissionJson = {
    name: 'Incredible Mission',
    versionNumber: 1,
    seed: 9802384709349,
    nodeStructure: {
      '1': {
        '2': {
          '3': {
            '4': {
              END: 'END',
            },
          },
        },
        '5': {
          '6': {
            '7': {
              END: 'END',
            },
          },
        },
        '8': {
          '9': {
            '10': {
              END: 'END',
            },
          },
        },
        '11': {
          '12': {
            '13': {
              END: 'END',
            },
          },
        },
      },
      '14': {
        '15': {
          '16': {
            '17': {
              END: 'END',
            },
            '18': { END: 'END' },
          },
        },
      },
      '19': {
        '20': {
          '21': { END: 'END' },
          '22': { END: 'END' },
        },
        '23': {
          '24': { END: 'END' },
        },
        '25': {
          '26': { END: 'END' },
        },
        '27': {
          '28': { END: 'END' },
          '29': { END: 'END' },
        },
      },
      '30': {
        '31': { END: 'END' },
        '32': { END: 'END' },
        '33': { END: 'END' },
        '34': { END: 'END' },
      },
    },
    nodeData: {
      '1': {
        nodeID: '1',
        name: 'Communications',
        color: 'green',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 0,
        mapY: -3,
      },
      '2': {
        nodeID: '2',
        name: 'Cellular Network',
        color: 'green',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network succeeded.',
        postExecutionFailureText: 'Cellular Network failed.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: -5,
      },
      '5': {
        nodeID: '5',
        name: 'Internet Provider',
        color: 'green',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: -4,
      },
      '8': {
        nodeID: '8',
        name: 'Instant Messaging',
        color: 'green',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: -3,
      },
      '11': {
        nodeID: '11',
        name: 'File Sharing Service',
        color: 'green',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: -2,
      },

      '3': {
        nodeID: '3',
        name: 'Callbank Cellular',
        color: 'green',
        preExecutionText: 'Callbank Cellular has not been executed.',
        postExecutionSuccessText: 'Callbank Cellular has been executed.',
        postExecutionFailureText: 'Callbank Cellular has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 3,
        mapY: -5,
      },

      '6': {
        nodeID: '6',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
        ],
        mapX: 3,
        mapY: -4,
      },
      '9': {
        nodeID: '9',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 3,
        mapY: -3,
      },
      '12': {
        nodeID: '12',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 3,
        mapY: -2,
      },
      '4': {
        nodeID: '4',
        name: 'Cellular Towers',
        color: 'green',
        preExecutionText: 'Cellular Towers has not been executed.',
        postExecutionSuccessText: 'Cellular Towers has been executed.',
        postExecutionFailureText: 'Cellular Towers has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 4,
        mapY: -5,
      },
      '7': {
        nodeID: '7',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 4,
        mapY: -4,
      },
      '10': {
        nodeID: '10',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 4,
        mapY: -3,
      },
      '13': {
        nodeID: '13',
        name: 'Main Server',
        color: 'green',
        preExecutionText: 'Main Server has not been executed.',
        postExecutionSuccessText: 'Main Server has been executed.',
        postExecutionFailureText: 'Main Server has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 4,
        mapY: -2,
      },
      '14': {
        nodeID: '14',
        name: 'Air Defense',
        color: 'pink',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 0,
        mapY: -1,
      },
      '15': {
        nodeID: '15',
        name: 'IADS Network',
        color: 'pink',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: -1,
      },
      '16': {
        nodeID: '16',
        name: 'Individual IADS Sites',
        color: 'pink',
        preExecutionText: 'Individual IADS Sites has not been executed.',
        postExecutionSuccessText: 'Individual IADS Sites has been executed.',
        postExecutionFailureText:
          'Individual IADS Sites has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: -1,
      },
      '17': {
        nodeID: '17',
        name: 'Launchers',
        color: 'pink',
        preExecutionText: 'Launchers has not been executed.',
        postExecutionSuccessText: 'Launchers has been executed.',
        postExecutionFailureText: 'Launchers has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 3,
        mapY: -1,
      },
      '18': {
        nodeID: '18',
        name: 'Radars',
        color: 'pink',
        preExecutionText: 'Radars has not been executed.',
        postExecutionSuccessText: 'Radars has been executed.',
        postExecutionFailureText: 'Radars has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 3,
        mapY: 0,
      },
      '19': {
        nodeID: '19',
        name: 'Infrastructure',
        color: 'yellow',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 0,
        mapY: 1,
      },
      '20': {
        nodeID: '20',
        name: 'Railroad System',
        color: 'yellow',
        preExecutionText: 'Railroad System has not been executed.',
        postExecutionSuccessText: 'Railroad System has been executed.',
        postExecutionFailureText: 'Railroad System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 0,
      },
      '23': {
        nodeID: '23',
        name: 'Electrical System',
        color: 'yellow',
        preExecutionText: 'Electrical System has not been executed.',
        postExecutionSuccessText: 'Electrical System has been executed.',
        postExecutionFailureText: 'Electrical System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 1,
      },
      '25': {
        nodeID: '25',
        name: 'Water System',
        color: 'yellow',
        preExecutionText: 'Water System has not been executed.',
        postExecutionSuccessText: 'Water System has been executed.',
        postExecutionFailureText: 'Water System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 2,
      },
      '27': {
        nodeID: '27',
        name: 'Road System',
        color: 'yellow',
        preExecutionText: 'Road System has not been executed.',
        postExecutionSuccessText: 'Road System has been executed.',
        postExecutionFailureText: 'Road System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 3,
      },
      '21': {
        nodeID: '21',
        name: 'Track Monitoring',
        color: 'yellow',
        preExecutionText: 'Track Monitoring has not been executed.',
        postExecutionSuccessText: 'Track Monitoring has been executed.',
        postExecutionFailureText: 'Track Monitoring has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 0,
      },
      '22': {
        nodeID: '22',
        name: 'Track Switch System',
        color: 'yellow',
        preExecutionText: 'Track Switch System has not been executed.',
        postExecutionSuccessText: 'Track Switch System has been executed.',
        postExecutionFailureText: 'Track Switch System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 1,
      },
      '24': {
        nodeID: '24',
        name: 'Regional Service',
        color: 'yellow',
        preExecutionText: 'Regional Service has not been executed.',
        postExecutionSuccessText: 'Regional Service has been executed.',
        postExecutionFailureText: 'Regional Service has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 2,
      },
      '26': {
        nodeID: '26',
        name: 'Valve System',
        color: 'yellow',
        preExecutionText: 'Valve System has not been executed.',
        postExecutionSuccessText: 'Valve System has been executed.',
        postExecutionFailureText: 'Valve System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 3,
      },
      '28': {
        nodeID: '28',
        name: 'Traffic Light System',
        color: 'yellow',
        preExecutionText: 'Traffic Light System has not been executed.',
        postExecutionSuccessText: 'Traffic Light System has been executed.',
        postExecutionFailureText: 'Traffic Light System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 4,
      },
      '29': {
        nodeID: '29',
        name: 'CCTV System',
        color: 'yellow',
        preExecutionText: 'CCTV System has not been executed.',
        postExecutionSuccessText: 'CCTV System has been executed.',
        postExecutionFailureText: 'CCTV System has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 2,
        mapY: 5,
      },
      '30': {
        nodeID: '30',
        name: 'Satellite Services',
        color: 'blue',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.5 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.6 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.6 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.7 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.8 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 0,
        mapY: 4,
      },
      '31': {
        nodeID: '31',
        name: 'Global Positioning',
        color: 'blue',
        preExecutionText: 'Global Positioning has not been executed.',
        postExecutionSuccessText: 'Global Positioning has been executed.',
        postExecutionFailureText: 'Global Positioning has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.1 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.25 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.5 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.6 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.7 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 4,
      },
      '32': {
        nodeID: '32',
        name: 'Data Transfer',
        color: 'blue',
        preExecutionText: 'Data Transfer has not been executed.',
        postExecutionSuccessText: 'Data Transfer has been executed.',
        postExecutionFailureText: 'Data Transfer has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.1 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.25 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.5 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.6 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.7 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 5,
      },
      '33': {
        nodeID: '33',
        name: 'Imagery Collection',
        color: 'blue',
        preExecutionText: 'Imagery Collection has not been executed.',
        postExecutionSuccessText: 'Imagery Collection has been executed.',
        postExecutionFailureText: 'Imagery Collection has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.1 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.25 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.5 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.6 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.7 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 6,
      },
      '34': {
        nodeID: '34',
        name: 'Sensor Observation',
        color: 'blue',
        preExecutionText: 'Sensor Observation has not been executed.',
        postExecutionSuccessText: 'Sensor Observation has been executed.',
        postExecutionFailureText: 'Sensor Observation has failed to execute.',
        actionData: 'exec command',
        executable: true,
        nodeActionItems: [
          { text: 'Deny', timeDelay: 1000, successChance: 0.1 },
          { text: 'Degrade', timeDelay: 2000, successChance: 0.25 },
          { text: 'Destroy', timeDelay: 3000, successChance: 0.5 },
          { text: 'Disrupt', timeDelay: 4000, successChance: 0.6 },
          { text: 'Manipulate', timeDelay: 5000, successChance: 0.7 },
          { text: 'Extract', timeDelay: 6000, successChance: 0.8 },
        ],
        mapX: 1,
        mapY: 7,
      },
    },
  }

  return Mission.fromJson(testMissionJson)
}

export default {
  MissionNode,
  Mission,
  createTestMission,
}
