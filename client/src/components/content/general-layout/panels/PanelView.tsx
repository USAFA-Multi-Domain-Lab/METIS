import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { usePanelContext } from './Panel'
import './PanelView.scss'

/**
 * A view that can be displayed in a panel. Multiple
 * views can be displayed in a panel, and they will
 * be toggled by the clicking of tabs at the top of
 * the panel.
 */
export default function ({
  children,
  title,
}: TPanelView_P): TReactElement | null {
  /* -- STATE -- */

  const { state } = usePanelContext()
  const [selectedView] = state.selectedView

  /* -- COMPUTED -- */

  /**
   * The classes used for the root element of
   * the component.
   */
  const classes = compute<ClassList>(() =>
    new ClassList('PanelView', `PanelView_${title.replace(/\s+/g, '_')}`).set(
      'Active',
      selectedView?.title === title,
    ),
  )

  /* -- RENDER -- */

  return <div className={classes.value}>{children}</div>
}

/**
 * Prop type for `PanelView`.
 */
export interface TPanelView_P {
  /**
   * The content of the panel view.
   */
  children?: React.ReactNode
  /**
   * A label for the view to distinguish it from
   * other views in the same panel.
   * @note This must be unique within the panel.
   */
  title: string
  /**
   * An optional icon to display in the tab.
   * Can be used alone or with the title.
   */
  icon?: TMetisIcon
  /**
   * A description of the view to be used as a tooltip.
   * @note By default, no tooltip is shown.
   */
  description?: string
  /**
   * Whether the tab is disabled and cannot be selected.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the tab should be visually highlighted
   * to grab attention.
   * @default false
   */
  highlighted?: boolean
}
