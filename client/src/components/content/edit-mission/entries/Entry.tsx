import { TMetisClientComponents } from 'src'
import MissionComponent from '../../../../../../shared/missions/component'
import './Entry.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic, editable details
 * of a mission component.
 */
export default function <
  TComponent extends MissionComponent<TMetisClientComponents, any>,
>({
  missionComponent: component,
  children,
}: TEntry_P<TComponent>): JSX.Element | null {
  /* -- RENDER -- */

  return (
    <div className='Entry'>
      <div className='EntryTop'>
        <EntryNavigation component={component} />
      </div>
      <div className='ScrollBox'>
        <div className='EntryContent'>{children}</div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

/**
 * The props for the `Entry` component.
 */
interface TEntry_P<
  TComponent extends MissionComponent<TMetisClientComponents, any>,
> {
  /**
   * The mission component to be edited.
   */
  missionComponent: TComponent
  /**
   * The children to be rendered.
   */
  children?: React.ReactNode
}
