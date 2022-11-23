import { useEffect, useRef } from 'react'
import './ConsoleOutput.scss'

const ConsoleOutput = (props: { value: string | null }) => {
  const scrollRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    let scrollRefElement: HTMLLIElement | null = scrollRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  if (props.value !== null) {
    return (
      <div className='ConsoleOutput'>
        <li
          className='Text'
          ref={scrollRef}
          dangerouslySetInnerHTML={{ __html: props.value }}
        ></li>
      </div>
    )
  } else {
    return null
  }
}

export default ConsoleOutput
