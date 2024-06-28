import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMission, { TMissionNavigable } from 'src/missions'
import { compute } from 'src/toolbox'
import './EntryNavigation.scss'

/**
 * Navigation for an entry component.
 */
export default function EntryNavigation({
  object,
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
   * The class for the back button.
   */
  const backButtonClass = compute<string>(() =>
    object.path.length > 1 ? 'BackButton' : 'BackButton Disabled',
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
      <div className={backButtonClass} onClick={onBackClick}>
        &lt;
        <Tooltip description='Go back.' />
      </div>
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
   * The navigation-compatible object displayed in the entry.
   */
  object: TMissionNavigable
}
