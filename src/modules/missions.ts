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
      Apples: {
        Bananas: {
          Kiwi: {
            END: 'END',
          },
        },
        Oranges: {
          Tomatoes: {
            END: 'END',
          },
        },
      },
    },
    nodeData: {
      Apples: {
        name: 'Garnish',
        preExecutionText: 'Apples has not been executed.',
        postExecutionSuccessText: 'Apples has been executed.',
        postExecutionFailureText: 'Apples has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 0,
        mapY: -2,
      },
      Bananas: {
        name: 'Green Beans',
        preExecutionText: 'Bananas has not been executed.',
        postExecutionSuccessText: 'Bananas has been executed.',
        postExecutionFailureText: 'Bananas has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -1,
        mapY: 0,
      },
      Oranges: {
        name: 'Tea',
        preExecutionText: 'Oranges has not been executed.',
        postExecutionSuccessText: 'Oranges has been executed.',
        postExecutionFailureText: 'Oranges has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 1,
        mapY: 0,
      },
      Kiwi: {
        name: 'Meat',
        preExecutionText: 'Kiwi has not been executed.',
        postExecutionSuccessText: 'Kiwi has been executed.',
        postExecutionFailureText: 'Kiwi has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: -1,
        mapY: 2,
      },
      Tomatoes: {
        name: 'Potatoes',
        preExecutionText: 'Tomatoes has not been executed.',
        postExecutionSuccessText: 'Tomatoes has been executed.',
        postExecutionFailureText: 'Tomatoes has failed to execute.',
        actionData: 'exec command',
        successChance: 0.3,
        mapX: 1,
        mapY: 2,
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
