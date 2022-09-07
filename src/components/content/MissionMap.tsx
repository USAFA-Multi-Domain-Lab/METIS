import React from 'react'
import './MissionMap.scss'

const MissionMap = () => {
  // Function that generates an output message based on the mission that
  // is chosen
  const OutputMessage = (e: any, user: string) => {
    let mission = e.target
    if (mission?.innerText === `COMMUNICATION`) {
      const TextArea = document.querySelector('.TextArea')
      let text = document.createElement('div')
      let textContents = `<li class='Text'>
      <span class='line-cursor'>${user}@USAFA: </span> 
      <span class='communication'>Communication</span> 
      has been executed.
      </li>`
      text.innerHTML = textContents
      TextArea?.append(text)
      // This keeps the terminal at the bottom with the history above it
      const BorderBox = document.querySelector('.BorderBox')
      BorderBox?.scrollTo(0, 10000000000000000)
      return
    } else if (mission?.innerText === `INFRASTRUCTURE`) {
      const TextArea = document.querySelector('.TextArea')
      let text = document.createElement('div')
      let textContents = `<li class='Text'>
      <span class='line-cursor'>${user}@USAFA: </span> 
      <span class='infrastructure'>Infrastructure</span> 
      has been executed.
      </li>`
      text.innerHTML = textContents
      TextArea?.append(text)
      // This keeps the terminal at the bottom with the history above it
      const BorderBox = document.querySelector('.BorderBox')
      BorderBox?.scrollTo(0, 10000000000000000)
      return
    } else if (mission?.innerText === `SATELLITE SERVICES`) {
      const TextArea = document.querySelector('.TextArea')
      let text = document.createElement('div')
      let textContents = `<li class='Text'>
      <span class='line-cursor'>${user}@USAFA: </span> 
      <span class='satellite-services'>Satellite Services</span> 
      has been executed.
      </li>`
      text.innerHTML = textContents
      TextArea?.append(text)
      // This keeps the terminal at the bottom with the history above it
      const BorderBox = document.querySelector('.BorderBox')
      BorderBox?.scrollTo(0, 10000000000000000)
      return
    }
  }

  // Renders HTML elements
  return (
    <div className='MissionMap'>
      <div className='Nodes'>
        <button
          className='communication'
          onClick={(e) => {
            OutputMessage(e, 'Jacob')
          }}
        >
          COMMUNICATION
        </button>
        <button
          className='infrastructure'
          onClick={(e) => {
            OutputMessage(e, 'Jacob')
          }}
        >
          INFRASTRUCTURE
        </button>
        <button
          className='satellite-services'
          onClick={(e) => {
            OutputMessage(e, 'Jacob')
          }}
        >
          SATELLITE SERVICES
        </button>
      </div>
    </div>
  )
}

export default MissionMap
