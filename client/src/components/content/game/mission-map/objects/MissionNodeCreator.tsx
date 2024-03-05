import ClientMissionNode from 'src/missions/nodes'
import './MissionNodeCreator.scss'
import { compute } from 'src/toolbox'
import NodeCreator from 'src/missions/nodes/creator'
import Tooltip from 'src/components/content/communication/Tooltip'

/* -- components -- */

/**
 * An object representing a node on the mission map.
 */
export default function MissionNodeCreator({
  creator,
}: TMissionNodeCreator_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle: React.CSSProperties = compute(() => {
    let neededHeight: number =
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE *
      ClientMissionNode.DEFAULT_NAME_LINE_COUNT
    let x: number = creator.position.x
    let y: number = creator.position.y
    let width: number = ClientMissionNode.WIDTH
    let height: number = Math.max(
      ClientMissionNode.DEFAULT_NAME_NEEDED_HEIGHT,
      neededHeight,
    )
    let verticalPadding: number = ClientMissionNode.VERTICAL_PADDING

    return {
      left: `${x}em`,
      top: `${y}em`,
      width: `${width}em`,
      height: `${height}em`,
      padding: `${verticalPadding}em 0`,
    }
  })

  /* -- functions -- */

  /**
   * Handler for when the creator is selected.
   */
  const onSelect = () => creator.create()

  /* -- render -- */

  // Render root JSX.
  return (
    <div
      key={creator.nodeID}
      className='MissionNodeCreator'
      style={rootStyle}
      onClick={onSelect}
    >
      <div className='Icon'></div>
      <Tooltip description='Create a node here.' />
    </div>
  )
}

/**
 * Props for `Node`.
 */
export type TMissionNodeCreator_P = {
  /**
   * The creator to display.
   */
  creator: NodeCreator
}
