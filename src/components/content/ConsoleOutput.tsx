import React from 'react'
import './ConsoleOutput.scss'
import Markdown, { MarkdownTheme } from './Markdown'

const ConsoleOutput = (props: { value: string }) => {
  return (
    <div className='ConsoleOutput'>
      <li
        className='Text'
        dangerouslySetInnerHTML={{ __html: props.value }}
      ></li>
      {/* <Markdown {} /> */}
    </div>
  )
}

export default ConsoleOutput
