import RichText from '@client/components/content/general-layout/rich-text/RichText'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect } from 'react'
import { useOutputContext } from '../Output'
import ExecutionMessageDynamicContent from './ExecutionMessageDynamicContent'
import './OutputMessage.scss'
import { useOutputRenderer } from './renderers'

/**
 * Checks to see if the output message begins with a paragraph element that
 * has a custom line height.
 * @param message The rendered message to read.
 * @returns The line height, or null when there is nothing to match.
 * @note All other elements within the output message are ignored.
 */
const readFirstLineHeight = (message: string): string | null => {
  const parsed = new DOMParser().parseFromString(message, 'text/html')
  const paragraph = parsed.body.firstElementChild

  if (!(paragraph instanceof HTMLParagraphElement)) return null
  if (paragraph.style.lineHeight) return paragraph.style.lineHeight

  for (const element of paragraph.querySelectorAll<HTMLElement>('[style]')) {
    if (element.style.lineHeight) return element.style.lineHeight
  }

  return null
}

/**
 * The actual message displayed in an output.
 */
export default function OutputMessage() {
  /* -- STATE -- */

  const { output, root } = useOutputContext()
  const { key, renderedMessage } = useOutputRenderer()

  /* -- COMPUTED -- */

  let rootClasses = new ClassList(
    'OutputMessage',
    `OutputMessage_${output.type}`,
  )

  /* -- EFFECTS -- */

  // Grabs the custom line height set in the rich text and assigns
  // it to a variable for the output info to use so that the output
  // info and output message remained aligned vertically.
  useEffect(() => {
    const outputElement = root.current
    if (!outputElement) return

    const lineHeight = readFirstLineHeight(renderedMessage)

    if (lineHeight) {
      outputElement.style.setProperty('--output-first-line', lineHeight)
    } else {
      outputElement.style.removeProperty('--output-first-line')
    }
  }, [root, renderedMessage])

  /* -- RENDER -- */

  return (
    <span className={rootClasses.value}>
      <RichText key={key} content={renderedMessage} type='viewer' />
      {output.type === 'execution-initiation' && output.sourceAction && (
        <ExecutionMessageDynamicContent />
      )}
    </span>
  )
}
