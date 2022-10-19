import { AnyObject } from 'mongoose'
import { JsxElement } from 'typescript'
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

// Runs the loading bar to progress according to the time frame used
export const nodeProcessBar = (
  timeDelay: number,
  nodeClassName: HTMLDivElement,
) => {
  let process = 0
  if (process == 0) {
    process = 1
    let width = 1
    let id = setInterval(frame, timeDelay / 100)
    function frame() {
      if (width >= 100) {
        clearInterval(id)
        process = 0
        if (
          nodeClassName !== null &&
          nodeClassName.firstElementChild !== null
        ) {
          ;(nodeClassName.firstElementChild as HTMLDivElement).classList.add(
            'hide',
          )
        }
      } else {
        width++
        if (
          nodeClassName !== null &&
          nodeClassName.firstElementChild !== null
        ) {
          ;(nodeClassName.firstElementChild as HTMLDivElement).classList.remove(
            'hide',
          )
          ;(nodeClassName.firstElementChild as HTMLDivElement).style.width =
            width + '%'
        }
      }
    }
  }
}

export default {
  handleNodeSelection,
  nodeProcessBar,
}
