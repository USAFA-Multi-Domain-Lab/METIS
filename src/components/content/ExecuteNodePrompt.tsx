import React, { useEffect, useRef } from 'react'
import './ExecuteNodePrompt.scss'

const ExecuteNodePrompt = (props: { value: string }) => {
  return (
    <div className='ExecuteNodePrompt'>
      <div className='PromptDisplayText'>
        Do you want to execute {props.value}?
      </div>
      <input type='text' className='PromptInput' name='PromptInput' />
    </div>
  )
}

export default ExecuteNodePrompt
