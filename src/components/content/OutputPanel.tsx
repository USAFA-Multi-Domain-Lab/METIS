import React, { useEffect, useRef } from 'react'
import './OutputPanel.scss'
import { useStore } from 'react-context-hook'
import ConsoleOutput from './ConsoleOutput'
import { Mission } from '../../modules/missions'

const OutputPanel = (): JSX.Element | null => {
  /* -- GLOBAL STATE -- */
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')

  /* -- RENDER -- */
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

export default OutputPanel
