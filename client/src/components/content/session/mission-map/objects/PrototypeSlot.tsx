import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype, {
  EPrototypeRelation,
} from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { Vector2D } from '../../../../../../../shared/toolbox/space'
import './MissionNodeCreator.scss'

/* -- components -- */

/**
 * An object representing a spot on the map where a
 * prototype can be placed.
 */
export default function PrototypeSlot({
  relative,
  relation,
  onClick = () => {},
}: TPrototypeSlot_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The key for the root element.
   */
  const key = compute<string>(() => {
    return `placement_${relative._id}_rel-${relation}`
  })

  /**
   * The placement position.
   */
  const position = compute<Vector2D>(() => {
    let result: Vector2D = relative.position.clone()

    // Shift position and depth based on relation.
    switch (relation) {
      case EPrototypeRelation.ParentOfTargetAndChildren:
        result.translateX(-2 * ClientMissionNode.COLUMN_WIDTH)
        break
      case EPrototypeRelation.ParentOfTargetOnly:
        result.translateX(-1 * ClientMissionNode.COLUMN_WIDTH)
        break
      case EPrototypeRelation.BetweenTargetAndChildren:
        result.translateX(1 * ClientMissionNode.COLUMN_WIDTH)
        break
      case EPrototypeRelation.PreviousSiblingOfTarget:
        result.translateY(-1 * ClientMissionNode.ROW_HEIGHT)
        break
      case EPrototypeRelation.FollowingSiblingOfTarget:
        result.translateY(1 * ClientMissionNode.ROW_HEIGHT)
        break
    }

    return result
  })

  /**
   * The inline styles for the root element.
   * @memoized
   */
  const rootStyle: React.CSSProperties = compute(() => {
    let neededHeight: number =
      ClientMissionNode.LINE_HEIGHT *
      ClientMissionNode.FONT_SIZE *
      ClientMissionNode.DEFAULT_NAME_LINE_COUNT
    let x: number = position.x
    let y: number = position.y
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

  /* -- render -- */

  // Render root JSX.
  return (
    <div key={key} className='Placement' style={rootStyle} onClick={onClick}>
      <div className='Icon'></div>
      <Tooltip description='Create a node here.' />
    </div>
  )
}

/**
 * Props for `PrototypeSlot`.
 */
export type TPrototypeSlot_P = {
  /**
   * The related prototype for the slot.
   */
  relative: ClientMissionPrototype
  /**
   * The relation between the slot and the prototype.
   */
  relation: EPrototypeRelation
  /**
   * Callback for when the slot is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
