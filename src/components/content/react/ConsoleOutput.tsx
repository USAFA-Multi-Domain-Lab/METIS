import { useEffect, useRef } from 'react'
import '../sass/ConsoleOutput.scss'

export interface IConsoleOutput {
  date: number
  value: string
}

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
