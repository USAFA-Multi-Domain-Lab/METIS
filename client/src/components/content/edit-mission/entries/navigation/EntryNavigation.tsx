import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import If from 'src/components/content/util/If'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import MissionComponent from '../../../../../../../shared/missions/component'
import './EntryNavigation.scss'

/**
 * Navigation for an entry component.
 */
export default function EntryNavigation({
  component,
}: TEntryNavigation_P): JSX.Element | null {
  const backButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'left',
        type: 'button',
        icon: 'left',
        onClick: () => component.mission.selectBack(),
        description: 'Go back.',
        disabled: component.path.length === 1,
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The path positions to display to the user.
   */
  const positions = compute<string[]>(() =>
    component.path.map((item, index) => {
      // If the root of the path is the mission,
      // then display 'Mission' instead of the
      // mission's name to save space in the UI.
      if (index === 0 && item instanceof ClientMission) return 'Mission'

      // Return the name of the item.
      return item.name
    }),
  )

  /* -- FUNCTION -- */

  /**
   * This will handle the click event for the path position.
   * @param index The index of the path position that was clicked.
   */
  const onPositionClick = (index: number) => {
    component.mission.select(component.path[index])
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
      <If condition={backButtonEngine.panelElements.length}>
        <ButtonSvgPanel engine={backButtonEngine} />
        <div className='Path'>
          <div className='Label'>Path: </div>
          <div className='Positions'>{positionsJsx}</div>
        </div>
      </If>
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
