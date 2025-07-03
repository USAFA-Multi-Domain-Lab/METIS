import Tooltip from '../../../communication/Tooltip'
import { useOutputContext } from '../Output'
import './NodeLocation.scss'
import './OutputInfo.scss'

/**
 * A locator option for quickly navigating to the node
 * that generated the output.
 */
export default function () {
  const { output, selectNode } = useOutputContext()
  const { sourceNode } = output

  // Render nothing if there is no node.
  if (!sourceNode) return null

  return (
    <div className='NodeLocation' onClick={() => selectNode(sourceNode)}>
      <Tooltip
        description={`Generated as a result of interacting with the node called "${sourceNode.name}."`}
      />
    </div>
  )
}
