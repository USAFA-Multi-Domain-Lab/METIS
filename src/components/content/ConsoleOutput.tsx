import React from 'react'
import './ConsoleOutput.scss'

const ConsoleOutput = (props: { value: string }) => {
  return (
    <div className='ConsoleOutput'>
      <li
        className='Text'
        dangerouslySetInnerHTML={{ __html: props.value }}
      ></li>
    </div>
  )
}

export default ConsoleOutput
