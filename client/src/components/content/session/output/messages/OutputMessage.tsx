import RichText from '@client/components/content/general-layout/rich-text/RichText'
import { compute } from '@client/toolbox'
import { useOutputContext } from '../Output'
import './OutputMessage.scss'
import { useOutputRenderer } from './renderers'

/**
 * The actual message displayed in an output.
 */
export default function () {
  /* -- STATE -- */

  const { output } = useOutputContext()
  const { key, renderedMessage } = useOutputRenderer()

  /* -- COMPUTED -- */

  /**
   * The class name for the root element.
   */
  const rootClassName = compute(() => {
    let classList = ['OutputMessage', `OutputMessage_${output.type}`]
    return classList.join(' ')
  })

  /* -- RENDER -- */

  return (
    <span className={rootClassName}>
      <RichText
        key={key}
        options={{ content: renderedMessage, editable: false }}
      />
    </span>
  )
}
