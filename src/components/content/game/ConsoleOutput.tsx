import { useEffect, useRef, useState } from 'react'
import './ConsoleOutput.scss'

export interface IConsoleOutput {
  key: string
  innerHTML: string
}

const ConsoleOutput = (props: IConsoleOutput): JSX.Element => {
  /* -- COMPONENT REF -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  /* -- COMPONENT EFFECT -- */
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

  const { key, innerHTML } = props

  return (
    <div
      className='ConsoleOutput'
      dangerouslySetInnerHTML={{ __html: innerHTML }}
      ref={scrollRef}
      key={key}
    ></div>
  )
}

export default ConsoleOutput
