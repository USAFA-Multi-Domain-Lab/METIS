import { TMetisClientComponents } from 'src'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import MissionComponent from '../../../../../../shared/missions/component'
import ClassList from '../../../../../../shared/toolbox/html/ClassList'
import ButtonSvgPanel from '../../../content/user-controls/buttons/panels/ButtonSvgPanel'
import ButtonSvgEngine from '../../../content/user-controls/buttons/panels/engines'
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
  svgEngines = [],
}: TEntry_P<TComponent>): TReactElement | null {
  const [login] = useGlobalContext().login
  const isAuthorized = login?.user.isAuthorized ?? (() => false)

  /* -- COMPUTED -- */

  /**
   * The class names for the entry bottom.
   */
  const entryBottomClasses = compute<ClassList>(() => {
    // Create a default list of class names.
    const classList: ClassList = new ClassList('EntryBottom')

    // Check to see if there are any SVG buttons that are authorized.
    const authorizedSvgButtons = svgEngines.flatMap(({ panelElements }) =>
      panelElements.filter(
        (element) =>
          element.type === 'button' && isAuthorized(element.permissions),
      ),
    )
    // Check to see if there are any other SVG elements that are not buttons.
    const otherSvgElements = svgEngines.flatMap(({ panelElements }) =>
      panelElements.filter((element) => !(element.type === 'button')),
    )

    // If there are no SVG elements, hide the entry bottom.
    if (authorizedSvgButtons.length === 0 && otherSvgElements.length === 0) {
      classList.add('Hidden')
    }

    // Return the class list.
    return classList
  })

  /* -- RENDER -- */

  return (
    <div className='Entry'>
      <div className='EntryTop'>
        <EntryNavigation component={component} />
      </div>
      <div className='ScrollBox'>
        <div className='EntryContent'>{children}</div>
      </div>
      <div className={entryBottomClasses.value}>
        {svgEngines.map((engine: ButtonSvgEngine, index: number) => (
          <ButtonSvgPanel
            key={`${component._id}_svg_engine_${index}`}
            engine={engine}
          />
        ))}
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
  /**
   * The engines that power the SVG buttons at the bottom of the entry.
   */
  svgEngines?: ButtonSvgEngine[]
}
