import { useEffect, useRef, useState } from 'react'
import './ConsoleOutput.scss'

export interface IConsoleOutput {
  key: string
  renderInnerHTML: () => string
}

const ConsoleOutput = (props: { output: IConsoleOutput }): JSX.Element => {
  let { key, renderInnerHTML } = props.output

  /* -- COMPONENT REF -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- COMPONENT STATE -- */
  const [mountHandled, setMountHandled] = useState<boolean>(false)

  /* -- COMPONENT EFFECT -- */

  // Equivalent of componentDidMount
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
    <div
      className='ConsoleOutput'
      dangerouslySetInnerHTML={{ __html: renderInnerHTML() }}
      ref={scrollRef}
      key={key}
    ></div>
  )
}

export default ConsoleOutput
