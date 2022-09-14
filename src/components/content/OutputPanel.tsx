import React from 'react'
import './OutputPanel.scss'
import { useStore } from 'react-context-hook'
import ConsoleOutput from './ConsoleOutput'

const OutputBox = () => {
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')

  return (
    <div className='OutputPanel'>
      <div className='BorderBox'>
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

export default OutputBox
