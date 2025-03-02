import { compute } from 'src/toolbox'
import './OutputMessage.scss'
import { useOutputContext } from '../Output'
import { useOutputRenderer } from './renderers'
import RichText from 'src/components/content/general-layout/rich-text/RichText'

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
