import './OutputPanel.scss'
import { useStore } from 'react-context-hook'
import ConsoleOutput from './ConsoleOutput'

const OutputPanel = (): JSX.Element | null => {
  /* -- GLOBAL STATE -- */
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] = useStore<boolean>(
    'outputPanelIsDisplayed',
  )

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
            (consoleOutput: { date: number; value: string | null }) => {
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
