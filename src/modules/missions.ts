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
  nodeID: string
  name: string
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
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
  _executed: boolean
  successChance: number
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

  constructor(
    nodeID: string,
    name: string,
    color: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    executable: boolean,
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
    this._executed = false
    this.successChance = successChance
    this._willSucceed = willSucceed
    this.mapX = mapX
    this.mapY = mapY
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
      'Communications': {
        'Cellular Network': {
          'Cellular Tower': {
            END: 'END',
          },
        },
        'Internet Provider': {
          'Service Provider': {
            END: 'END',
          },
        },
        'Instant Messaging': {
          'Central Server 1': {
            END: 'END',
          },
        },
        'File Sharing Service': {
          'Central Server 2': {
            END: 'END',
          },
        },
      },
      'Air Defense': {
        'IADS Network': {
          'Individual Launch Sites': {
            'Launcher System': {
              END: 'END',
            },
            'Radar System': { END: 'END' },
          },
        },
      },
      'Infrastructure': {
        'Railroad System': {
          'Track Monitoring': { END: 'END' },
          'Track Switch System': { END: 'END' },
        },
        'Electrical System': {
          'Regional Service': { END: 'END' },
        },
        'Water System': {
          'Valve System': { END: 'END' },
        },
        'Road System': {
          'Traffic Light System': { END: 'END' },
          'CCTV System': { END: 'END' },
        },
      },
      'Satellite Services': {
        'Global Positioning': { END: 'END' },
        'Data Transfer': { END: 'END' },
        'Imagery Collection': { END: 'END' },
        'Sensor Observation': { END: 'END' },
      },
    },
    nodeData: {
      'Communications': {
        nodeID: '1',
        name: 'Communications',
        color: 'green',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 0,
        mapY: -2,
      },
      'Cellular Network': {
        nodeID: '2',
        name: 'Cellular Network',
        color: 'green',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network has been executed.',
        postExecutionFailureText: 'Cellular Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: -2,
      },
      'Internet Provider': {
        nodeID: '3',
        name: 'Internet Provider',
        color: 'green',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: -1,
      },
      'Instant Messaging': {
        nodeID: '4',
        name: 'Instant Messaging',
        color: 'green',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 0,
      },
      'File Sharing Service': {
        nodeID: '5',
        name: 'File Sharing Service',
        color: 'green',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 1,
      },
      'Cellular Tower': {
        nodeID: '6',
        name: 'Cellular Tower',
        color: 'green',
        preExecutionText: 'Cellular Tower has not been executed.',
        postExecutionSuccessText: 'Cellular Tower has been executed.',
        postExecutionFailureText: 'Cellular Tower has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: -2,
      },
      'Service Provider': {
        nodeID: 'Service Provider',
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: -1,
      },

      'Central Server 1': {
        nodeID: '8',
        name: 'Central Server 1',
        color: 'green',
        preExecutionText: 'Central Server 1 has not been executed.',
        postExecutionSuccessText: 'Central Server 1 has been executed.',
        postExecutionFailureText: 'Central Server 1 has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 0,
      },

      'Central Server 2': {
        nodeID: '9',
        name: 'Central Server 2',
        color: 'green',
        preExecutionText: 'Central Server 2 has not been executed.',
        postExecutionSuccessText: 'Central Server 2 has been executed.',
        postExecutionFailureText: 'Central Server 2 has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 1,
      },
      'Air Defense': {
        nodeID: '10',
        name: 'Air Defense',
        color: 'pink',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 0,
        mapY: 2,
      },
      'IADS Network': {
        nodeID: '11',
        name: 'IADS Network',
        color: 'pink',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 2,
      },
      'Individual Launch Sites': {
        nodeID: '12',
        name: 'Individual Launch Sites',
        color: 'pink',
        preExecutionText: 'Individual Launch Sites has not been executed.',
        postExecutionSuccessText: 'Individual Launch Sites has been executed.',
        postExecutionFailureText:
          'Individual Launch Sites has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 2,
      },
      'Launcher System': {
        nodeID: '13',
        name: 'Launcher System',
        color: 'pink',
        preExecutionText: 'Launcher System has not been executed.',
        postExecutionSuccessText: 'Launcher System has been executed.',
        postExecutionFailureText: 'Launcher System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 3,
        mapY: 2,
      },
      'Radar System': {
        nodeID: '14',
        name: 'Radar System',
        color: 'pink',
        preExecutionText: 'Radar System has not been executed.',
        postExecutionSuccessText: 'Radar System has been executed.',
        postExecutionFailureText: 'Radar System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 3,
        mapY: 3,
      },
      'Infrastructure': {
        nodeID: '15',
        name: 'Infrastructure',
        color: 'yellow',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 0,
        mapY: 4,
      },
      'Railroad System': {
        nodeID: '16',
        name: 'Railroad System',
        color: 'yellow',
        preExecutionText: 'Railroad System has not been executed.',
        postExecutionSuccessText: 'Railroad System has been executed.',
        postExecutionFailureText: 'Railroad System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 4,
      },
      'Electrical System': {
        nodeID: '17',
        name: 'Electrical System',
        color: 'yellow',
        preExecutionText: 'Electrical System has not been executed.',
        postExecutionSuccessText: 'Electrical System has been executed.',
        postExecutionFailureText: 'Electrical System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 5,
      },
      'Water System': {
        nodeID: '18',
        name: 'Water System',
        color: 'yellow',
        preExecutionText: 'Water System has not been executed.',
        postExecutionSuccessText: 'Water System has been executed.',
        postExecutionFailureText: 'Water System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 6,
      },
      'Road System': {
        nodeID: '19',
        name: 'Road System',
        color: 'yellow',
        preExecutionText: 'Road System has not been executed.',
        postExecutionSuccessText: 'Road System has been executed.',
        postExecutionFailureText: 'Road System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 7,
      },
      'Track Monitoring': {
        nodeID: '20',
        name: 'Track Monitoring',
        color: 'yellow',
        preExecutionText: 'Track Monitoring has not been executed.',
        postExecutionSuccessText: 'Track Monitoring has been executed.',
        postExecutionFailureText: 'Track Monitoring has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 3,
      },
      'Track Switch System': {
        nodeID: '21',
        name: 'Track Switch System',
        color: 'yellow',
        preExecutionText: 'Track Switch System has not been executed.',
        postExecutionSuccessText: 'Track Switch System has been executed.',
        postExecutionFailureText: 'Track Switch System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 4,
      },
      'Regional Service': {
        nodeID: '22',
        name: 'Regional Service',
        color: 'yellow',
        preExecutionText: 'Regional Service has not been executed.',
        postExecutionSuccessText: 'Regional Service has been executed.',
        postExecutionFailureText: 'Regional Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 5,
      },
      'Valve System': {
        nodeID: '23',
        name: 'Valve System',
        color: 'yellow',
        preExecutionText: 'Valve System has not been executed.',
        postExecutionSuccessText: 'Valve System has been executed.',
        postExecutionFailureText: 'Valve System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 6,
      },
      'Traffic Light System': {
        nodeID: '24',
        name: 'Traffic Light System',
        color: 'yellow',
        preExecutionText: 'Traffic Light System has not been executed.',
        postExecutionSuccessText: 'Traffic Light System has been executed.',
        postExecutionFailureText: 'Traffic Light System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 7,
      },
      'CCTV System': {
        nodeID: '25',
        name: 'CCTV System',
        color: 'yellow',
        preExecutionText: 'CCTV System has not been executed.',
        postExecutionSuccessText: 'CCTV System has been executed.',
        postExecutionFailureText: 'CCTV System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 8,
      },
      'Satellite Services': {
        nodeID: '26',
        name: 'Satellite Services',
        color: 'blue',
        preExecutionText: '',
        postExecutionSuccessText: '',
        postExecutionFailureText: '',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 0,
        mapY: 9,
      },
      'Global Positioning': {
        nodeID: '27',
        name: 'Global Positioning',
        color: 'blue',
        preExecutionText: 'Global Positioning has not been executed.',
        postExecutionSuccessText: 'Global Positioning has been executed.',
        postExecutionFailureText: 'Global Positioning has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 9,
      },
      'Data Transfer': {
        nodeID: '28',
        name: 'Data Transfer',
        color: 'blue',
        preExecutionText: 'Data Transfer has not been executed.',
        postExecutionSuccessText: 'Data Transfer has been executed.',
        postExecutionFailureText: 'Data Transfer has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 10,
      },
      'Imagery Collection': {
        nodeID: '29',
        name: 'Imagery Collection',
        color: 'blue',
        preExecutionText: 'Imagery Collection has not been executed.',
        postExecutionSuccessText: 'Imagery Collection has been executed.',
        postExecutionFailureText: 'Imagery Collection has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 11,
      },
      'Sensor Observation': {
        nodeID: '30',
        name: 'Sensor Observation',
        color: 'blue',
        preExecutionText: 'Sensor Observation has not been executed.',
        postExecutionSuccessText: 'Sensor Observation has been executed.',
        postExecutionFailureText: 'Sensor Observation has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 1,
        mapY: 12,
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
