import ClientOutput from 'src/missions/forces/output'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'
import Tooltip from '../../communication/Tooltip'

/**
 * Renders the output message.
 */
export default function Output({
  output: { key, timeStamp, prefix, node, message },
  selectNode,
}: TOutput_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The JSX for the output message.
   */
  const outputMessageJsx: JSX.Element = compute(() => {
    switch (key) {
      case 'execution-succeeded':
        return (
          <span className='Succeeded'>
            <RichTextOutputBox text={message} />
          </span>
        )
      case 'execution-failed':
        return (
          <span className='Failed'>
            <RichTextOutputBox text={message} />
          </span>
        )
      default:
        return <RichTextOutputBox text={message} />
    }
  })

  /**
   * The JSX used to locate the node.
   */
  const locateNodeJsx: JSX.Element | null = compute(() =>
    node ? (
      <div className='Location' onClick={() => selectNode(node)}>
        <Tooltip
          description={
            `Generated as a result of interacting with the node called "${node.name}."`
            // `\n` +
            // `\t\n` +
            // `Click to view the node.`
          }
        />
      </div>
    ) : null,
  )

  /* -- RENDER -- */

  if (!!message) {
    return (
      <div className='Text'>
        <span className='LineCursor'>
          {locateNodeJsx} [{timeStamp}] {prefix}{' '}
        </span>
        {outputMessageJsx}
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR PRE-EXECUTION ---------------------------- */

/**
 * Prop type for `Output`.
 */
type TOutput_P = {
  /**
   * The output for the force's output panel.
   */
  output: ClientOutput
  /**
   * Selects a node.
   * @param node The node to select.
   */
  selectNode: (node: ClientMissionNode | null) => void
}
