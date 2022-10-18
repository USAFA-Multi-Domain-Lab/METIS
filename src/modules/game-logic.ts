import { AnyObject } from 'mongoose'
import missions, { createTestMission, Mission, MissionNode } from './missions'
import NodeStructureReference from './node-reference'

const referenceMission = createTestMission()

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

export const nodeProcessBar = () => {}

export default {
  handleNodeSelection,
  nodeProcessBar,
}
