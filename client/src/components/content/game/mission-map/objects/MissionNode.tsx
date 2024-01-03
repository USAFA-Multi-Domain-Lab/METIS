import { useMemo } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import './MissionNode.scss'

/**
 * An object representing a node on the mission map.
 */
export default function MissionNode({
  node,
}: TMissionNode_P): JSX.Element | null {
  /**
   * The inline styles for the node.
   * @memoized
   */
  const style = useMemo((): React.CSSProperties => {
    return {
      left: `${node.position.x}em`,
      top: `${node.position.y}em`,
    }
  }, [node.position.toString()])

  return (
    <div key={node.nodeID} className='MissionNode' style={style}>
      <div className='Title Text'>{node.name}</div>
    </div>
  )
}

/**
 * Props for `Node`.
 */
export type TMissionNode_P = {
  /**
   * The node to display.
   */
  node: ClientMissionNode
}
