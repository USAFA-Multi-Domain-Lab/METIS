import { isDisabled } from '@testing-library/user-event/dist/utils'
import { text } from 'node:stream/consumers'
import React from 'react'
import './MissionMap.scss'

const MissionMap = () => {
  // Function that generates an output message based on the mission that
  // is chosen
  const OutputMessage = (e: any, num: number) => {
    let mission = e.target
    if (mission?.innerText === `Mission ${num}`) {
      const TextArea = document.querySelector('.TextArea')
      let text = document.createElement('div')
      let textContents = `<li class='Text'> 
      >> This is the output message for Mission ${num}.
      </li>`
      text.innerHTML = textContents
      TextArea?.append(text)
      return
    }
  }

  // Renders HTML elements
  return (
    <div className='MissionMap'>
      <div className='Nodes'>
        <button
          onClick={(e) => {
            OutputMessage(e, 1)
          }}
        >
          Mission 1
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 2)
          }}
        >
          Mission 2
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 3)
          }}
        >
          Mission 3
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 4)
          }}
        >
          Mission 4
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 5)
          }}
        >
          Mission 5
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 6)
          }}
        >
          Mission 6
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 7)
          }}
        >
          Mission 7
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 8)
          }}
        >
          Mission 8
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 9)
          }}
        >
          Mission 9
        </button>
        <button
          onClick={(e) => {
            OutputMessage(e, 10)
          }}
        >
          Mission 10
        </button>
      </div>
    </div>
  )
}

export default MissionMap
