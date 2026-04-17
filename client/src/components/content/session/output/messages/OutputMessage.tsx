import RichText from '@client/components/content/general-layout/rich-text/RichText'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useOutputContext } from '../Output'
import ExecutionMessageDynamicContent from './ExecutionMessageDynamicContent'
import './OutputMessage.scss'
import { useOutputRenderer } from './renderers'

/**
 * The actual message displayed in an output.
 */
export default function OutputMessage() {
  /* -- STATE -- */

  const { output } = useOutputContext()
  const { key, renderedMessage } = useOutputRenderer()

  /* -- COMPUTED -- */

  let rootClasses = new ClassList(
    'OutputMessage',
    `OutputMessage_${output.type}`,
  )

  /* -- RENDER -- */

  return (
    <span className={rootClasses.value}>
      <RichText
        key={key}
        options={{ content: renderedMessage, editable: false }}
      />
      {output.type === 'execution-initiation' && output.sourceAction && (
        <ExecutionMessageDynamicContent />
      )}
    </span>
  )
}
