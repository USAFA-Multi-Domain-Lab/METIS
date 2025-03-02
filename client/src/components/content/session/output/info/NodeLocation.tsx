import Tooltip from '../../../communication/Tooltip'
import { useOutputContext } from '../Output'
import './OutputInfo.scss'
import './NodeLocation.scss'

/**
 * A locator option for quickly navigating to the node
 * that generated the output.
 */
export default function () {
  const {
    output: { node },
    selectNode,
  } = useOutputContext()

  // Render nothing if there is no node.
  if (!node) return null

  return (
    <div className='NodeLocation' onClick={() => selectNode(node)}>
      <Tooltip
        description={`Generated as a result of interacting with the node called "${node.name}."`}
      />
    </div>
  )
}
