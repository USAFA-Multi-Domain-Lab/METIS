import { AnyObject } from 'mongoose'
import { JsxElement } from 'typescript'
import missions, { createMission, Mission, MissionNode } from './missions'
import NodeStructureReference from './node-reference'

const referenceMission = createMission()

export const handleNodeSelection = (selectedNode: MissionNode) => {
  if (selectedNode.expandable && !selectedNode.isExpanded) {
    selectedNode.expand()
  }
}

// Runs the loading bar to progress according to the time frame used
export const runNodeLoadingBar = (
  timeDelay: number,
  nodeElement: HTMLDivElement,
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
        if (nodeElement !== null && nodeElement.firstElementChild !== null) {
          let firstChild: HTMLDivElement =
            nodeElement.firstElementChild as HTMLDivElement

          firstChild.classList.add('hide')
        }
      } else {
        width++
        if (nodeElement !== null && nodeElement.firstElementChild !== null) {
          let firstChild: HTMLDivElement =
            nodeElement.firstElementChild as HTMLDivElement

          firstChild.classList.remove('hide')
          firstChild.style.width = width + '%'
        }
      }
    }
  }
}

export default {
  handleNodeSelection,
  nodeProcessBar: runNodeLoadingBar,
}
