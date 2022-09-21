import missions, { createTestMission, Mission, MissionNode } from './missions'

const referenceMission = createTestMission()

export function createInitialMissionState(): Mission {
  const initialMissionState: Mission = {
    name: referenceMission.name,
    versionNumber: referenceMission.versionNumber,
    nodeStructure: {},
    nodeData: new Map<string, MissionNode>(),
  }

  for (let nodeKey in referenceMission.nodeStructure) {
    ;(initialMissionState.nodeStructure as any)[nodeKey] = {}
    let data = referenceMission.nodeData.get(nodeKey)
    if (data !== undefined) {
      initialMissionState.nodeData.set(nodeKey, data)
    } else {
      throw new Error(
        'key is undefined. Check to see if key exists in the database.',
      )
    }
  }
  return initialMissionState
}

export const handleNodeSelection = (
  missionState: Mission,
  node: MissionNode,
): Mission => {
  // // Renders the next set of sub-nodes as the user clicks on
  // //  one of the initial nodes
  // for (let data of referenceMission.nodeData) {
  //   // Loops through the second tier of node objects in the
  //   // node structure and nests them inside the initial nodes
  //   for (let nodeKey in referenceMission.nodeStructure) {
  //     let secondaryNodes = (referenceMission.nodeStructure as any)[nodeKey]
  //     if (node.name === nodeKey) {
  //       for (let eachNode in secondaryNodes) {
  //         if (eachNode === data[0]) {
  //           ;(secondaryNodes as any)[eachNode] = {}
  //           ;(missionState.nodeStructure as any)[nodeKey] = secondaryNodes
  //         }
  //       }
  //     }
  //     // Renders the node data
  //     missionState.nodeData = referenceMission.nodeData
  //   }
  // }

  // Loops through the third tier of node objects in the
  // node structure and nests them inside the secondary nodes
  // for (let data of missionState.nodeData) {
  //   let currentNodeStructure = missionState.nodeStructure
  //   for (let initialNodeKey in currentNodeStructure) {
  //     let secondaryNodeValues = (currentNodeStructure as any)[initialNodeKey]
  //     for (let eachNode in secondaryNodeValues) {
  //       if (eachNode === data[0]) {
  // console.log(eachNode)
  //       }
  //     }

  //   if (secondaryNodeValues === nodeKey) {
  //     console.log(secondaryNodeValues)
  //   }
  // }
  // }
  // console.log(missionState)

  return missionState
}

export default { createInitialMissionState, handleNodeSelection }
