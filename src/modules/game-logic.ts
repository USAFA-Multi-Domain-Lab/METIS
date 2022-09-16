import missions, { createTestMission, Mission, MissionNode } from './missions'

export function gameLogic(): Mission {
  const mission = createTestMission()

  const initialMissionState: Mission = {
    name: mission.name,
    versionNumber: mission.versionNumber,
    nodeStructure: {},
    nodeData: new Map<string, MissionNode>(),
  }

  for (let nodeKey in mission.nodeStructure) {
    ;(initialMissionState.nodeStructure as any)[nodeKey] = {}
  }

  for (let data of mission.nodeData) {
    // console.log(data[0])

    if (data[0] === 'communications') {
      ;(initialMissionState.nodeData as any).set(data[0], data[1])
    } else if (data[0] === 'airDefense') {
      ;(initialMissionState.nodeData as any).set(data[0], data[1])
    } else if (data[0] === 'infrastructure') {
      ;(initialMissionState.nodeData as any).set(data[0], data[1])
    } else if (data[0] === 'satelliteServices') {
      ;(initialMissionState.nodeData as any).set(data[0], data[1])
    }
  }
  return initialMissionState
}

export default gameLogic
