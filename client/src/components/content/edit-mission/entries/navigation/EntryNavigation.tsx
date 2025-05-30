import ButtonSvg, {
  TButtonSvgDisabled,
} from 'src/components/content/user-controls/buttons/ButtonSvg'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import MissionComponent from '../../../../../../../shared/missions/component'
import './EntryNavigation.scss'

/**
 * Navigation for an entry component.
 */
export default function EntryNavigation({
  component: object,
}: TEntryNavigation_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The path positions to display to the user.
   */
  const positions = compute<string[]>(() =>
    object.path.map((item, index) => {
      // If the root of the path is the mission,
      // then display 'Mission' instead of the
      // mission's name to save space in the UI.
      if (index === 0 && item instanceof ClientMission) return 'Mission'

      // Return the name of the item.
      return item.name
    }),
  )

  /**
   * Whether the up button should be disabed,
   * which is there is no parent for the current
   * selection.
   */
  const upButtonDisabled = compute<TButtonSvgDisabled>(() =>
    object.path.length === 1 ? 'full' : 'none',
  )

  /* -- FUNCTION -- */

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const onPositionClick = (index: number) => {
    object.mission.select(object.path[index])
  }

  /**
   * This will handle the back button being clicked.
   */
  const onBackClick = () => {
    object.mission.selectBack()
  }

  /* -- RENDER -- */

  /**
   * JSX for positions.
   */
  const positionsJsx = positions.map((position: string, index: number) => {
    return (
      <span className='Position' key={`position-${index}`}>
        <span className='Text' onClick={() => onPositionClick(index)}>
          {position}
        </span>{' '}
        {index === positions.length - 1 ? '' : ' > '}
      </span>
    )
  })

  // Render root element.
  return (
    <div className='EntryNavigation'>
      <ButtonSvg
        type={'left'}
        onClick={onBackClick}
        description={'Go back.'}
        disabled={upButtonDisabled}
      />
      <div className='Path'>
        <div className='Label'>Path: </div>
        <div className='Positions'>{positionsJsx}</div>
      </div>
    </div>
  )
}

/**
 * Props for the `EntryNavigation` component.
 */
export type TEntryNavigation_P = {
  /**
   * The navigation-compatible component displayed
   * in the entry.
   */
  component: MissionComponent<any, any>
}
