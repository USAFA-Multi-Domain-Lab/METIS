import { MissionNode } from './mission-nodes'

export const handleNodeSelection = (selectedNode: MissionNode) => {
  if (selectedNode.hasChildren && !selectedNode.isOpen) {
    selectedNode.open()
  }
}

// Runs the loading bar to progress according to the time frame used
export const runNodeLoadingBar = (timeDelay: number) => {
  let process = 0
  if (process == 0) {
    process = 1
    let width = 1

    let id = setInterval(frame, timeDelay / 100)

    function frame() {
      if (width >= 100) {
        clearInterval(id)
        process = 0
      } else {
        let loadingElement: HTMLDivElement | null =
          document.querySelector<HTMLDivElement>(
            'div.mapped-node.LoadingBar .loading',
          )

        width++

        if (loadingElement !== null) {
          loadingElement.style.width = width + '%'
        }
      }
    }
  }
}

export default {
  handleNodeSelection,
  runNodeLoadingBar,
}
