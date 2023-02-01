import '../sass/OutputPanel.scss'
import ConsoleOutput from './ConsoleOutput'

const OutputPanel = (props: {
  consoleOutputs: Array<{ date: number; value: string }>
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
          {consoleOutputs.map(
            (consoleOutput: { date: number; value: string }) => {
              return (
                <ConsoleOutput
                  key={consoleOutput.date}
                  value={consoleOutput.value}
                />
              )
            },
          )}
        </ul>
      </div>
    </div>
  )
}

export default OutputPanel
