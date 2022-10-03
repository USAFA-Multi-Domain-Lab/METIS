import React, { useEffect, useRef } from 'react'
import './NewExecuteWindow.scss'
import { useStore } from 'react-context-hook'
import ExecuteNodePrompt from './ExecuteNodePrompt'

const NewExecuteWindow = () => {
  /* -- GLOBAL STATE -- */
  const [executeNodePrompts, setExecuteNodePrompts] =
    useStore<Array<{ date: number; value: string }>>('executeNodePrompts')

  return (
    <div className='NewExecuteWindow'>
      <ul className='ExecutionPane'>
        {executeNodePrompts.map(
          (executeNodePrompt: { date: number; value: string }) => {
            return (
              <ExecuteNodePrompt
                key={executeNodePrompt.date}
                value={executeNodePrompt.value}
              />
            )
          },
        )}
      </ul>
    </div>
  )
}

export default NewExecuteWindow
