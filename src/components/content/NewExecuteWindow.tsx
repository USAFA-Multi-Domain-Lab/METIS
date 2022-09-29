import React, { useEffect, useRef } from 'react'
import './NewExecuteWindow.scss'
import { useStore } from 'react-context-hook'
import ExecuteNodePrompt from './ExecuteNodePrompt'

const NewExecuteWindow = () => {
  /* -- GLOBAL STATE -- */
  const [executeNodePrompts, setExecuteNodePrompts] =
    useStore<Array<{ date: number; value: string }>>('executeNodePrompts')

  const displayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let displayRefElement: HTMLDivElement | null = displayRef.current
    if (displayRefElement !== null) {
      if (executeNodePrompts.length === 0) {
        displayRefElement.style.display = 'none'
      } else {
        displayRefElement.style.display = 'flex'
      }
    }
  }, [executeNodePrompts])

  return (
    <div className='NewExecuteWindow' ref={displayRef}>
      <div className='ExecutionPane'>
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
      </div>
    </div>
  )
}

export default NewExecuteWindow
