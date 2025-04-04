import { TMetisClientComponents } from 'src'
import { TMissionComponent } from '../../../../../../shared/missions'
import './Entry.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic, editable details
 * of a mission component.
 */
export default function <
  TComponent extends TMissionComponent<TMetisClientComponents, any>,
>({
  missionComponent: component,
  children,
}: TEntry_P<TComponent>): JSX.Element | null {
  /* -- RENDER -- */

  return (
    <div className='Entry SidePanel'>
      <div className='BoxTop'>
        <EntryNavigation component={component} />
      </div>
      <div className='BoxContent'>{children}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

/**
 * The props for the `Entry` component.
 */
interface TEntry_P<
  TComponent extends TMissionComponent<TMetisClientComponents, any>,
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
