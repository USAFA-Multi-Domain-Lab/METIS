import React, { useEffect, useRef } from 'react'
import './ConsoleOutput.scss'
import Markdown, { MarkdownTheme } from './Markdown'

const ConsoleOutput = (props: { value: string }) => {
  const scrollRef: any = useRef()

  useEffect(() => {
    scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className='ConsoleOutput'>
      {/* <li
        className='Text'
        ref={scrollRef}
        dangerouslySetInnerHTML={{ __html: props.value }}
      ></li> */}

      <div className='Text' ref={scrollRef}>
        <Markdown
          markdown={props.value}
          theme={MarkdownTheme.ThemePrimary}
          lineDivider='\n'
        />
      </div>
    </div>
  )
}

export default ConsoleOutput
