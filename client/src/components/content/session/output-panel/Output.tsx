import ClientOutput from 'src/missions/forces/output'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import RichText from '../../general-layout/RichText'

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
            <RichText options={{ content: message, editable: false }} />
          </span>
        )
      case 'execution-failed':
        return (
          <span className='Failed'>
            <RichText options={{ content: message, editable: false }} />
          </span>
        )
      default:
        return <RichText options={{ content: message, editable: false }} />
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
