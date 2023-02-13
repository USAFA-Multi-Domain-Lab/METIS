import { useEffect, useRef, useState } from 'react'
import './ConsoleOutput.scss'

export interface IConsoleOutput {
  date: number
  elements: JSX.Element
}

const ConsoleOutput = (props: {
  key: number
  value: JSX.Element
}): JSX.Element => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  useEffect(() => {
    if (!mountHandled) {
      let scrollRefElement: HTMLDivElement | null = scrollRef.current

      if (scrollRefElement !== null) {
        scrollRefElement.scrollIntoView({ behavior: 'smooth' })
      }

      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- RENDER -- */

  return (
    <div className='ConsoleOutput' ref={scrollRef}>
      {props.value}
    </div>
  )
}

export default ConsoleOutput
