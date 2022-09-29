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
// Making a note here that in order to get the execute prompt display to
// disappear after the students type in their command the executeNodePrompts
// array length has to equal 0.

// Based on this, the logic needs to somehow work where if the student types
// in "exec" then the executeNodePrompts empties and then another function
//  fires a way to check the mission success and then determines if the
// selected node succeeds or fails which will determine if the next set of
// subnodes unlock or not.

export default {
  createInitialMissionState,
  handleNodeSelection,
}
