import { useState } from 'react'
import ClientMissionForce from 'src/missions/forces'
import ClientOutput from 'src/missions/forces/outputs'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import RichTextOutputBox from '../../communication/RichTextOutputBox'
import Tooltip from '../../communication/Tooltip'

/**
 * Renders the output message.
 */
export default function Output({
  force,
  output: { key, timeStamp, prefix, nodeId, message },
  selectNode,
}: TOutput_P): JSX.Element | null {
  /* -- STATE -- */
  const [node] = useState<ClientMissionNode | null>(
    force.getNode(nodeId) ?? null,
  )

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
          description={`Generated as a result of interacting with the node called "${node.name}."`}
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
   * The force where the output panel belongs.
   */
  force: ClientMissionForce
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
