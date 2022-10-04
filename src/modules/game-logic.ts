import { AnyObject } from 'mongoose'
import missions, { createTestMission, Mission, MissionNode } from './missions'
import NodeStructureReference from './node-reference'

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
  selectedNodeData: MissionNode,
  missionState: NodeStructureReference,
) => {
  let selectedReference: NodeStructureReference | undefined =
    NodeStructureReference.findReference(missionState, selectedNodeData)

  if (
    selectedReference !== undefined &&
    selectedReference.expandable &&
    !selectedReference.isExpanded
  ) {
    selectedReference.expand()
  }
}

export default {
  createInitialMissionState,
  handleNodeSelection,
}
