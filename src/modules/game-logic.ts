import missions, { createTestMission, Mission, MissionNode } from './missions'

export function createInitialMissionState(): Mission {
  const mission = createTestMission()

  const initialMissionState: Mission = {
    name: mission.name,
    versionNumber: mission.versionNumber,
    nodeStructure: {},
    nodeData: new Map<string, MissionNode>(),
  }

  for (let nodeKey in mission.nodeStructure) {
    ;(initialMissionState.nodeStructure as any)[nodeKey] = {}
    let data = mission.nodeData.get(nodeKey)
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
  return missionState
}

export default { createInitialMissionState, handleNodeSelection }
