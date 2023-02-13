import './OutputPanel.scss'
import ConsoleOutput, { IConsoleOutput } from './ConsoleOutput'

const OutputPanel = (props: {
  consoleOutputs: Array<JSX.Element>
  setOutputPanelIsDisplayed: (outputPanelIsDisplayed: boolean) => void
}): JSX.Element | null => {
  let consoleOutputs = props.consoleOutputs
  let setOutputPanelIsDisplayed = props.setOutputPanelIsDisplayed

  /* -- COMPONENT FUNCTIONS -- */

  const closeOutputPanel = () => {
    setOutputPanelIsDisplayed(false)
  }

  /* -- RENDER -- */
  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
        <div className='MinimizeButtonContainer'>
          <span className='MinimizeButton' onClick={closeOutputPanel}>
            x
          </span>
        </div>
        <ul className='TextArea'>
          {consoleOutputs.map((consoleOutput: JSX.Element) => {
            return consoleOutput
          })}
        </ul>
      </div>
    </div>
  )
}

export default OutputPanel
