import { useEffect, useRef, useState } from 'react'
import './ConsoleOutput.scss'

export interface IConsoleOutput {
  date: number
  nodeID: string
  elements: string
}

const ConsoleOutput = (props: { key: number; value: string }): JSX.Element => {
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

      // updateElements(props.value)

      setMountHandled(true)
    }
  }, [mountHandled])

  // const updateElements = (element: JSX.Element) => {
  //   let childElements = element.props.children

  //   if (childElements && typeof childElements !== 'string') {
  //     childElements.forEach((childElement: JSX.Element) => {
  //       if (childElement.key === `${selectedNode?.nodeID}_timer`) {
  //         console.log(childElement.props)
  //         childElement.props = {
  //           children: ['Time remaining', `${selectedNode?.timeLeft}`],
  //         }
  //       }
  //       if (childElement.props !== undefined) {
  //         updateElements(childElement)
  //       }
  //     })
  //   }
  // }

  /* -- RENDER -- */
  return (
    <div
      className='ConsoleOutput'
      dangerouslySetInnerHTML={{ __html: props.value }}
      ref={scrollRef}
    ></div>
  )
}

export default ConsoleOutput
