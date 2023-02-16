import './OutputPanel.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import ConsoleOutput, { IConsoleOutput } from './ConsoleOutput'

const OutputPanel = (props: {
  consoleOutputs: Array<IConsoleOutput>
  selectedNode: MissionNode | null
  setOutputPanelIsDisplayed: (outputPanelIsDisplayed: boolean) => void
}): JSX.Element | null => {
  let consoleOutputs: Array<IConsoleOutput> = props.consoleOutputs
  let selectedNode: MissionNode | null = props.selectedNode
  let setOutputPanelIsDisplayed = props.setOutputPanelIsDisplayed

  /* -- COMPONENT FUNCTIONS -- */

  const closeOutputPanel = () => {
    setOutputPanelIsDisplayed(false)
  }

  /* -- RENDER -- */

  consoleOutputs.forEach((consoleOutput: IConsoleOutput) => {
    selectedNode?.mission.nodes.forEach((node: MissionNode) => {
      if (
        consoleOutput.elements.includes('Time remaining:') &&
        consoleOutput.nodeID === node.nodeID
      ) {
        consoleOutput.elements = `
              <div class='Text'>
                <div class='Timer'>
                Time remaining: ${node.timeLeft}
                </div>
              </div>`
      }
    })
  })

  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
        <div className='MinimizeButtonContainer'>
          <span className='MinimizeButton' onClick={closeOutputPanel}>
            x
          </span>
        </div>
        <ul className='TextArea'>
          {consoleOutputs.map((consoleOutput: IConsoleOutput) => {
            return (
              <ConsoleOutput
                key={consoleOutput.date}
                value={consoleOutput.elements}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default OutputPanel
