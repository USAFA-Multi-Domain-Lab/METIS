import { v4 as generateHash } from 'uuid'
import NodeStructureReference from './node-reference'
import { isInteger } from './numbers'
import { cloneDeep, random } from 'lodash'
import { AnyObject } from 'mongoose'

// This is the raw mission data returned
// from the server used to create instances
// of the Mission class.
export interface IMissionJson {
  name: string
  versionNumber: number
  nodeStructure: object
  nodeData: object
}

// This is the raw node data returned
// from the server used to create instances
// of MissionNode in the Mission class.
export interface IMissionNodeJson {
  name: string
  className: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  successChance: number
  mapX: number
  mapY: number
}

// This represents an individual node
// for a student to execute within a
// mission.
export class MissionNode {
  _instanceId: string
  name: string
  className: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  executable: boolean
  successChance: number
  _willSucceed: boolean
  mapX: number
  mapY: number

  get instanceID(): string {
    return this._instanceId
  }

  get willSucceed(): boolean {
    return this._willSucceed
  }

  constructor(
    name: string,
    className: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    executable: boolean,
    successChance: number,
    mapX: number,
    mapY: number,
  ) {
    this._instanceId = generateHash()
    this.name = name
    this.className = className
    this.preExecutionText = preExecutionText
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.actionData = actionData
    this.executable = executable
    this.successChance = successChance
    this._willSucceed = MissionNode.checkSuccess(successChance)
    this.mapX = mapX
    this.mapY = mapY
  }

  static checkSuccess = (successChance: number): boolean => {
    return Math.random() >= successChance
  }
}

// This represents a mission for a
// student to complete.
export class Mission {
  name: string
  versionNumber: number
  nodeStructure: object
  nodeData: Map<string, MissionNode>

  constructor(
    name: string,
    versionNumber: number,
    nodeStructure: object,
    nodeData: Map<string, MissionNode>,
  ) {
    this.name = name
    this.versionNumber = versionNumber
    this.nodeStructure = nodeStructure
    this.nodeData = nodeData
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
      let nodeStructure: object = json.nodeStructure
      let nodeDataJson: object = json.nodeData
      let nodeData: Map<string, MissionNode> = new Map<string, MissionNode>()
      let nodeDataKeys: string[] = Object.keys(nodeDataJson)

      // Throws error if versionNumber is
      // not an integer.
      if (!isInteger(versionNumber)) {
        throw new Error()
      }

      // Converts raw node data into MissionNode
      // objects, then it stores the created
      // objects in the nodeData map.
      for (let key of nodeDataKeys) {
        let nodeDatum: IMissionNodeJson = (nodeDataJson as any)[key]

        if (!isInteger(nodeDatum.mapX) || !isInteger(nodeDatum.mapY)) {
          throw new Error()
        }

        let node: MissionNode = new MissionNode(
          nodeDatum.name,
          nodeDatum.className,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.actionData,
          nodeDatum.executable,
          nodeDatum.successChance,
          nodeDatum.mapX,
          nodeDatum.mapY,
        )
        nodeData.set(key, node)
      }

      // Create mission object and return it.
      mission = new Mission(name, versionNumber, nodeStructure, nodeData)
      return mission
    } catch (error) {
      console.error('Invalid JSON passed to create Mission object.')
      throw error
    }
  }

  static renderMission = (
    originalMission: Mission,
    nodeStructureReference: NodeStructureReference,
    nodeStructure: AnyObject,
    missionRender: Mission | null = null,
  ): Mission => {
    if (missionRender === null) {
      missionRender = new Mission(
        originalMission.name,
        originalMission.versionNumber,
        cloneDeep(originalMission.nodeStructure),
        new Map<string, MissionNode>(),
      )
      nodeStructure = missionRender.nodeStructure
    } else {
      let nodeName: string = nodeStructureReference.name
      let nodeDatum: MissionNode | undefined =
        originalMission.nodeData.get(nodeName)

      if (nodeDatum !== undefined) {
        missionRender.nodeData.set(nodeName, nodeDatum)
      } else {
        console.error(
          new Error(
            `Cannot render mission since the nodeDatum with the name ${nodeName} could not be found in the original mission:`,
          ),
        )
        return new Mission(
          originalMission.name,
          originalMission.versionNumber,
          {},
          new Map<string, MissionNode>(),
        )
      }
    }

    let subnodes = nodeStructureReference.subnodes

    if (!nodeStructureReference.isExpanded) {
      for (let key of Object.keys(nodeStructure)) {
        delete nodeStructure[key]
      }
      return missionRender
    }

    for (let subnode of subnodes) {
      if (!(subnode.name in nodeStructure)) {
        console.error(
          new Error(
            `Cannot render mission since the nodeReference subnode ${subnode.name} cannot be found in nodeStructure:`,
          ),
        )
        return new Mission(
          originalMission.name,
          originalMission.versionNumber,
          {},
          new Map<string, MissionNode>(),
        )
      }

      let substructure: AnyObject = nodeStructure[subnode.name]

      Mission.renderMission(
        originalMission,
        subnode,
        substructure,
        missionRender,
      )
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
        name: 'Communications',
        className: 'green',
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
        name: 'Cellular Network',
        className: 'green',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network has been executed.',
        postExecutionFailureText: 'Cellular Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: -2,
      },
      'Internet Provider': {
        name: 'Internet Provider',
        className: 'green',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: -1,
      },
      'Instant Messaging': {
        name: 'Instant Messaging',
        className: 'green',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 0,
      },
      'File Sharing Service': {
        name: 'File Sharing Service',
        className: 'green',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 1,
      },
      'Cellular Tower': {
        name: 'Cellular Tower',
        className: 'green',
        preExecutionText: 'Cellular Tower has not been executed.',
        postExecutionSuccessText: 'Cellular Tower has been executed.',
        postExecutionFailureText: 'Cellular Tower has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: -2,
      },
      'Service Provider': {
        name: 'Service Provider',
        className: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: -1,
      },

      'Central Server 1': {
        name: 'Central Server 1',
        className: 'green',
        preExecutionText: 'Central Server 1 has not been executed.',
        postExecutionSuccessText: 'Central Server 1 has been executed.',
        postExecutionFailureText: 'Central Server 1 has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 0,
      },

      'Central Server 2': {
        name: 'Central Server 2',
        className: 'green',
        preExecutionText: 'Central Server 2 has not been executed.',
        postExecutionSuccessText: 'Central Server 2 has been executed.',
        postExecutionFailureText: 'Central Server 2 has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 1,
      },
      'Air Defense': {
        name: 'Air Defense',
        className: 'pink',
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
        name: 'IADS Network',
        className: 'pink',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 2,
      },
      'Individual Launch Sites': {
        name: 'Individual Launch Sites',
        className: 'pink',
        preExecutionText: 'Individual Launch Sites has not been executed.',
        postExecutionSuccessText: 'Individual Launch Sites has been executed.',
        postExecutionFailureText:
          'Individual Launch Sites has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 2,
      },
      'Launcher System': {
        name: 'Launcher System',
        className: 'pink',
        preExecutionText: 'Launcher System has not been executed.',
        postExecutionSuccessText: 'Launcher System has been executed.',
        postExecutionFailureText: 'Launcher System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 6,
        mapY: 2,
      },
      'Radar System': {
        name: 'Radar System',
        className: 'pink',
        preExecutionText: 'Radar System has not been executed.',
        postExecutionSuccessText: 'Radar System has been executed.',
        postExecutionFailureText: 'Radar System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 6,
        mapY: 3,
      },
      'Infrastructure': {
        name: 'Infrastructure',
        className: 'yellow',
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
        name: 'Railroad System',
        className: 'yellow',
        preExecutionText: 'Railroad System has not been executed.',
        postExecutionSuccessText: 'Railroad System has been executed.',
        postExecutionFailureText: 'Railroad System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 4,
      },
      'Electrical System': {
        name: 'Electrical System',
        className: 'yellow',
        preExecutionText: 'Electrical System has not been executed.',
        postExecutionSuccessText: 'Electrical System has been executed.',
        postExecutionFailureText: 'Electrical System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 5,
      },
      'Water System': {
        name: 'Water System',
        className: 'yellow',
        preExecutionText: 'Water System has not been executed.',
        postExecutionSuccessText: 'Water System has been executed.',
        postExecutionFailureText: 'Water System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 6,
      },
      'Road System': {
        name: 'Road System',
        className: 'yellow',
        preExecutionText: 'Road System has not been executed.',
        postExecutionSuccessText: 'Road System has been executed.',
        postExecutionFailureText: 'Road System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 7,
      },
      'Track Monitoring': {
        name: 'Track Monitoring',
        className: 'yellow',
        preExecutionText: 'Track Monitoring has not been executed.',
        postExecutionSuccessText: 'Track Monitoring has been executed.',
        postExecutionFailureText: 'Track Monitoring has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 3,
      },
      'Track Switch System': {
        name: 'Track Switch System',
        className: 'yellow',
        preExecutionText: 'Track Switch System has not been executed.',
        postExecutionSuccessText: 'Track Switch System has been executed.',
        postExecutionFailureText: 'Track Switch System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 4,
      },
      'Regional Service': {
        name: 'Regional Service',
        className: 'yellow',
        preExecutionText: 'Regional Service has not been executed.',
        postExecutionSuccessText: 'Regional Service has been executed.',
        postExecutionFailureText: 'Regional Service has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 5,
      },
      'Valve System': {
        name: 'Valve System',
        className: 'yellow',
        preExecutionText: 'Valve System has not been executed.',
        postExecutionSuccessText: 'Valve System has been executed.',
        postExecutionFailureText: 'Valve System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 6,
      },
      'Traffic Light System': {
        name: 'Traffic Light System',
        className: 'yellow',
        preExecutionText: 'Traffic Light System has not been executed.',
        postExecutionSuccessText: 'Traffic Light System has been executed.',
        postExecutionFailureText: 'Traffic Light System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 7,
      },
      'CCTV System': {
        name: 'CCTV System',
        className: 'yellow',
        preExecutionText: 'CCTV System has not been executed.',
        postExecutionSuccessText: 'CCTV System has been executed.',
        postExecutionFailureText: 'CCTV System has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 4,
        mapY: 8,
      },
      'Satellite Services': {
        name: 'Satellite Services',
        className: 'blue',
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
        name: 'Global Positioning',
        className: 'blue',
        preExecutionText: 'Global Positioning has not been executed.',
        postExecutionSuccessText: 'Global Positioning has been executed.',
        postExecutionFailureText: 'Global Positioning has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 9,
      },
      'Data Transfer': {
        name: 'Data Transfer',
        className: 'blue',
        preExecutionText: 'Data Transfer has not been executed.',
        postExecutionSuccessText: 'Data Transfer has been executed.',
        postExecutionFailureText: 'Data Transfer has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 10,
      },
      'Imagery Collection': {
        name: 'Imagery Collection',
        className: 'blue',
        preExecutionText: 'Imagery Collection has not been executed.',
        postExecutionSuccessText: 'Imagery Collection has been executed.',
        postExecutionFailureText: 'Imagery Collection has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
        mapY: 11,
      },
      'Sensor Observation': {
        name: 'Sensor Observation',
        className: 'blue',
        preExecutionText: 'Sensor Observation has not been executed.',
        postExecutionSuccessText: 'Sensor Observation has been executed.',
        postExecutionFailureText: 'Sensor Observation has failed to execute.',
        actionData: 'exec command',
        executable: false,
        successChance: 0.3,
        mapX: 2,
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
