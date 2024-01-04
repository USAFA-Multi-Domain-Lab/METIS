import { useMemo } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import './MissionNode.scss'

/**
 * An object representing a node on the mission map.
 */
export default function MissionNode({
  node,
}: TMissionNode_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The number of lines in the node's title.
   */
  const titleLineCount = useMemo((): number => {
    return node.nameLineCount
  }, [node.name])

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle = useMemo((): React.CSSProperties => {
    let neededHeight: number = node.nameNeededHeight
    let x: number = node.position.x
    let y: number = node.position.y
    let width: number = ClientMissionNode.WIDTH
    let height: number = Math.max(
      ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT,
      neededHeight,
    )

    return {
      left: `${x}em`,
      top: `${y}em`,
      width: `${width}em`,
      height: `${height}em`,
    }
  }, [node.position.toString(), titleLineCount])

  /**
   * The inline styles for the node's title.
   * @memoized
   */
  const titleStyle = useMemo((): React.CSSProperties => {
    let width: number = ClientMissionNode.NAME_WIDTH_RATIO * 100
    let fontSize: number = ClientMissionNode.FONT_SIZE
    let lineHeight: number = ClientMissionNode.LINE_HEIGHT

    return {
      width: `${width}%`,
      fontSize: `${fontSize}em`,
      lineHeight: `${lineHeight}em`,
    }
  }, undefined)

  return (
    <div key={node.nodeID} className='MissionNode' style={rootStyle}>
      <div className='Title Text' style={titleStyle}>
        {node.name}
      </div>
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
