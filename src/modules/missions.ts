import { v4 as generateHash } from 'uuid'
import { isInteger } from './numbers'

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
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
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
  color: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  successChance: number
  mapX: number
  mapY: number

  get instanceID(): string {
    return this._instanceId
  }

  constructor(
    name: string,
    color: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    successChance: number,
    mapX: number,
    mapY: number,
  ) {
    this._instanceId = generateHash()
    this.name = name
    this.color = color
    this.preExecutionText = preExecutionText
    this.postExecutionSuccessText = postExecutionSuccessText
    this.postExecutionFailureText = postExecutionFailureText
    this.actionData = actionData
    this.successChance = successChance
    this.mapX = mapX
    this.mapY = mapY
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
          nodeDatum.color,
          nodeDatum.preExecutionText,
          nodeDatum.postExecutionSuccessText,
          nodeDatum.postExecutionFailureText,
          nodeDatum.actionData,
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
        color: 'green',
        preExecutionText: 'Communications has not been executed.',
        postExecutionSuccessText: 'Communications has been executed.',
        postExecutionFailureText: 'Communications has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: -2,
      },
      'Cellular Network': {
        name: 'Cellular Network',
        color: 'green',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network has been executed.',
        postExecutionFailureText: 'Cellular Network has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -2,
        mapY: 0,
      },
      'Internet Provider': {
        name: 'Internet Provider',
        color: 'green',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 0,
      },
      'Instant Messaging': {
        name: 'Instant Messaging',
        color: 'green',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 0,
      },
      'File Sharing Service': {
        name: 'File Sharing Service',
        color: 'green',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 2,
        mapY: 0,
      },
      'Cellular Tower': {
        name: 'Cellular Tower',
        color: 'green',
        preExecutionText: 'Cellular Tower has not been executed.',
        postExecutionSuccessText: 'Cellular Tower has been executed.',
        postExecutionFailureText: 'Cellular Tower has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -2,
        mapY: 2,
      },
      'Service Provider': {
        name: 'Service Provider',
        color: 'green',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 2,
      },

      'Central Server 1': {
        name: 'Central Server 1',
        color: 'green',
        preExecutionText: 'Central Server 1 has not been executed.',
        postExecutionSuccessText: 'Central Server 1 has been executed.',
        postExecutionFailureText: 'Central Server 1 has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 2,
      },

      'Central Server 2': {
        name: 'Central Server 2',
        color: 'green',
        preExecutionText: 'Central Server 2 has not been executed.',
        postExecutionSuccessText: 'Central Server 2 has been executed.',
        postExecutionFailureText: 'Central Server 2 has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 2,
        mapY: 2,
      },
      'Air Defense': {
        name: 'Air Defense',
        color: 'pink',
        preExecutionText: 'Air Defense has not been executed.',
        postExecutionSuccessText: 'Air Defense has been executed.',
        postExecutionFailureText: 'Air Defense has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: -1,
      },
      'IADS Network': {
        name: 'IADS Network',
        color: 'pink',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: 6,
      },
      'Individual Launch Sites': {
        name: 'Individual Launch Sites',
        color: 'pink',
        preExecutionText: 'Individual Launch Sites has not been executed.',
        postExecutionSuccessText: 'Individual Launch Sites has been executed.',
        postExecutionFailureText:
          'Individual Launch Sites has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: 8,
      },
      'Launcher System': {
        name: 'Launcher System',
        color: 'pink',
        preExecutionText: 'Launcher System has not been executed.',
        postExecutionSuccessText: 'Launcher System has been executed.',
        postExecutionFailureText: 'Launcher System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 10,
      },
      'Radar System': {
        name: 'Radar System',
        color: 'pink',
        preExecutionText: 'Radar System has not been executed.',
        postExecutionSuccessText: 'Radar System has been executed.',
        postExecutionFailureText: 'Radar System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 10,
      },
      'Infrastructure': {
        name: 'Infrastructure',
        color: 'yellow',
        preExecutionText: 'Infrastructure has not been executed.',
        postExecutionSuccessText: 'Infrastructure has been executed.',
        postExecutionFailureText: 'Infrastructure has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: 0,
      },
      'Railroad System': {
        name: 'Railroad System',
        color: 'yellow',
        preExecutionText: 'Railroad System has not been executed.',
        postExecutionSuccessText: 'Railroad System has been executed.',
        postExecutionFailureText: 'Railroad System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -2,
        mapY: 14,
      },
      'Electrical System': {
        name: 'Electrical System',
        color: 'yellow',
        preExecutionText: 'Electrical System has not been executed.',
        postExecutionSuccessText: 'Electrical System has been executed.',
        postExecutionFailureText: 'Electrical System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 14,
      },
      'Water System': {
        name: 'Water System',
        color: 'yellow',
        preExecutionText: 'Water System has not been executed.',
        postExecutionSuccessText: 'Water System has been executed.',
        postExecutionFailureText: 'Water System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 14,
      },
      'Road System': {
        name: 'Road System',
        color: 'yellow',
        preExecutionText: 'Road System has not been executed.',
        postExecutionSuccessText: 'Road System has been executed.',
        postExecutionFailureText: 'Road System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 2,
        mapY: 14,
      },
      'Track Monitoring': {
        name: 'Track Monitoring',
        color: 'yellow',
        preExecutionText: 'Track Monitoring has not been executed.',
        postExecutionSuccessText: 'Track Monitoring has been executed.',
        postExecutionFailureText: 'Track Monitoring has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -3,
        mapY: 16,
      },
      'Track Switch System': {
        name: 'Track Switch System',
        color: 'yellow',
        preExecutionText: 'Track Switch System has not been executed.',
        postExecutionSuccessText: 'Track Switch System has been executed.',
        postExecutionFailureText: 'Track Switch System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -2,
        mapY: 16,
      },
      'Regional Service': {
        name: 'Regional Service',
        color: 'yellow',
        preExecutionText: 'Regional Service has not been executed.',
        postExecutionSuccessText: 'Regional Service has been executed.',
        postExecutionFailureText: 'Regional Service has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 16,
      },
      'Valve System': {
        name: 'Valve System',
        color: 'yellow',
        preExecutionText: 'Valve System has not been executed.',
        postExecutionSuccessText: 'Valve System has been executed.',
        postExecutionFailureText: 'Valve System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 16,
      },
      'Traffic Light System': {
        name: 'Traffic Light System',
        color: 'yellow',
        preExecutionText: 'Traffic Light System has not been executed.',
        postExecutionSuccessText: 'Traffic Light System has been executed.',
        postExecutionFailureText: 'Traffic Light System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 2,
        mapY: 16,
      },
      'CCTV System': {
        name: 'CCTV System',
        color: 'yellow',
        preExecutionText: 'CCTV System has not been executed.',
        postExecutionSuccessText: 'CCTV System has been executed.',
        postExecutionFailureText: 'CCTV System has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 3,
        mapY: 16,
      },
      'Satellite Services': {
        name: 'Satellite Services',
        color: 'blue',
        preExecutionText: 'Satellite Services has not been executed.',
        postExecutionSuccessText: 'Satellite Services has been executed.',
        postExecutionFailureText: 'Satellite Services has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 0,
        mapY: 1,
      },
      'Global Positioning': {
        name: 'Global Positioning',
        color: 'blue',
        preExecutionText: 'Global Positioning has not been executed.',
        postExecutionSuccessText: 'Global Positioning has been executed.',
        postExecutionFailureText: 'Global Positioning has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -2,
        mapY: 20,
      },
      'Data Transfer': {
        name: 'Data Transfer',
        color: 'blue',
        preExecutionText: 'Data Transfer has not been executed.',
        postExecutionSuccessText: 'Data Transfer has been executed.',
        postExecutionFailureText: 'Data Transfer has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: -1,
        mapY: 20,
      },
      'Imagery Collection': {
        name: 'Imagery Collection',
        color: 'blue',
        preExecutionText: 'Imagery Collection has not been executed.',
        postExecutionSuccessText: 'Imagery Collection has been executed.',
        postExecutionFailureText: 'Imagery Collection has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 1,
        mapY: 20,
      },
      'Sensor Observation': {
        name: 'Sensor Observation',
        color: 'blue',
        preExecutionText: 'Sensor Observation has not been executed.',
        postExecutionSuccessText: 'Sensor Observation has been executed.',
        postExecutionFailureText: 'Sensor Observation has failed to execute.',
        actionData: 'exec command',
        display: 'yes',
        successChance: 0.3,
        mapX: 2,
        mapY: 20,
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
