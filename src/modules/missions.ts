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
  name: string
  preExecutionText: string
  postExecutionSuccessText: string
  postExecutionFailureText: string
  actionData: string
  successChance: number
  mapX: number
  mapY: number

  constructor(
    name: string,
    preExecutionText: string,
    postExecutionSuccessText: string,
    postExecutionFailureText: string,
    actionData: string,
    successChance: number,
    mapX: number,
    mapY: number,
  ) {
    this.name = name
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
      communication: {
        cellularNetwork: {
          cellularTower: {
            END: 'END',
          },
        },
        internetProvider: {
          serviceProvider: {
            END: 'END',
          },
        },
        instantMessaging: {
          centralServer1: {
            END: 'END',
          },
        },
        fileSharingService: {
          centralServer2: {
            END: 'END',
          },
        },
      },
      airDefense: {
        iadsNetwork: {
          individualLaunchSites: {
            launcherSystem: {},
            radarSystem: {},
          },
        },
      },
    },
    nodeData: {
      communication: {
        name: 'Communications',
        preExecutionText: 'Communications has not been executed.',
        postExecutionSuccessText: 'Communications has been executed.',
        postExecutionFailureText: 'Communications has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 0,
        mapY: -2,
      },
      cellularNetwork: {
        name: 'Cellular Network',
        preExecutionText: 'Cellular Network has not been executed.',
        postExecutionSuccessText: 'Cellular Network has been executed.',
        postExecutionFailureText: 'Cellular Network has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -2,
        mapY: 0,
      },
      internetProvider: {
        name: 'Internet Provider',
        preExecutionText: 'Internet Provider has not been executed.',
        postExecutionSuccessText: 'Internet Provider has been executed.',
        postExecutionFailureText: 'Internet Provider has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 1,
        mapY: 0,
      },
      instantMessaging: {
        name: 'Instant Messaging',
        preExecutionText: 'Instant Messaging has not been executed.',
        postExecutionSuccessText: 'Instant Messaging has been executed.',
        postExecutionFailureText: 'Instant Messaging has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -1,
        mapY: 0,
      },
      fileSharingService: {
        name: 'File Sharing Service',
        preExecutionText: 'File Sharing Service has not been executed.',
        postExecutionSuccessText: 'File Sharing Service has been executed.',
        postExecutionFailureText: 'File Sharing Service has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 2,
        mapY: 0,
      },
      cellularTower: {
        name: 'Cellular Tower',
        preExecutionText: 'Cellular Tower has not been executed.',
        postExecutionSuccessText: 'Cellular Tower has been executed.',
        postExecutionFailureText: 'Cellular Tower has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -2,
        mapY: 2,
      },
      serviceProvider: {
        name: 'Service Provider',
        preExecutionText: 'Service Provider has not been executed.',
        postExecutionSuccessText: 'Service Provider has been executed.',
        postExecutionFailureText: 'Service Provider has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 1,
        mapY: 2,
      },

      centralServer1: {
        name: 'Central Server',
        preExecutionText: 'Central Server has not been executed.',
        postExecutionSuccessText: 'Central Server has been executed.',
        postExecutionFailureText: 'Central Server has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -1,
        mapY: 2,
      },

      centralServer2: {
        name: 'Central Server',
        preExecutionText: 'Central Server has not been executed.',
        postExecutionSuccessText: 'Central Server has been executed.',
        postExecutionFailureText: 'Central Server has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 2,
        mapY: 2,
      },
      airDefense: {
        name: 'Air Defense',
        preExecutionText: 'Air Defense has not been executed.',
        postExecutionSuccessText: 'Air Defense has been executed.',
        postExecutionFailureText: 'Air Defense has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 0,
        mapY: 4,
      },
      iadsNetwork: {
        name: 'IADS Network',
        preExecutionText: 'IADS Network has not been executed.',
        postExecutionSuccessText: 'IADS Network has been executed.',
        postExecutionFailureText: 'IADS Network has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 0,
        mapY: 6,
      },
      individualLaunchSites: {
        name: 'Individual Launch Sites',
        preExecutionText: 'Individual Launch Sites has not been executed.',
        postExecutionSuccessText: 'Individual Launch Sites has been executed.',
        postExecutionFailureText:
          'Individual Launch Sites has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 0,
        mapY: 8,
      },
      launcherSystem: {
        name: 'Launcher System',
        preExecutionText: 'Launcher System has not been executed.',
        postExecutionSuccessText: 'Launcher System has been executed.',
        postExecutionFailureText: 'Launcher System has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 1,
        mapY: 10,
      },
      radarSystem: {
        name: 'Radar System',
        preExecutionText: 'Radar System has not been executed.',
        postExecutionSuccessText: 'Radar System has been executed.',
        postExecutionFailureText: 'Radar System has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -1,
        mapY: 10,
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
