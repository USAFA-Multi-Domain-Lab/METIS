import React, { useEffect, useRef } from 'react'
import './ConsoleOutput.scss'
import Markdown, { MarkdownTheme } from './Markdown'

const ConsoleOutput = (props: { value: string }) => {
  const scrollRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    let scrollRefElement: HTMLLIElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return (
    <div className='ConsoleOutput'>
      <li
        className='Text'
        ref={scrollRef}
        dangerouslySetInnerHTML={{ __html: props.value }}
      ></li>
    </div>
  )
}

export default ConsoleOutput
