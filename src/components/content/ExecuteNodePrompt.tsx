import React, { useEffect, useRef } from 'react'
import './ExecuteNodePrompt.scss'
import { useStore } from 'react-context-hook'
import gameLogic from '../../modules/game-logic'
import { MissionNode } from '../../modules/missions'
import NodeStructureReference from '../../modules/node-reference'

const ExecuteNodePrompt = (props: { value: string }) => {
  /* -- GLOBAL STATE -- */
  let [executePromptIsDisplayed, setExecutePromptIsDisplayed] = useStore<
    Array<Boolean>
  >('executePromptIsDisplayed')

  const execution = (): void => {
    setExecutePromptIsDisplayed([false])
  }

  return (
    <div className='ExecuteNodePrompt'>
      <li className='x' onClick={execution}>
        x
      </li>
      <li className='PromptDisplayText'>
        Do you want to execute {props.value}?
      </li>

      <button className='ExecutionButton' onClick={execution}>
        Execute
      </button>
    </div>
  )
}

export default ExecuteNodePrompt
