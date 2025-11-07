import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { usePanelContext } from '../Panel'
import type { TPanelView_P } from '../PanelView'
import './PanelTab.scss'

/**
 * A tab that, when toggled, will display a view
 * in a panel, hiding the previous view.
 */
export default function ({ view }: TPanelTab_P): TReactElement | null {
  /* -- STATE -- */

  const { state } = usePanelContext()
  const [selectedView, select] = state.selectedView

  /* -- EFFECTS -- */

  /* -- COMPUTED -- */

  /**
   * The class names of the root element of the
   * component.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('PanelTab')
    result.set('Selected', view.title === selectedView?.title)
    return result
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for when the root element is clicked.
   */
  const onClick = () => {
    select(view)
  }

  /* -- RENDER -- */

  /**
   * The tooltip for the tab, if one is
   * provided.
   */
  const renderTooltip = () => {
    if (!view.description) return null
    return <Tooltip key={'tab-tooltip'} description={view.description} />
  }

  return (
    <div className={rootClasses.value} onClick={onClick}>
      <div className='TabTitle'>{view.title}</div>
      {renderTooltip()}
    </div>
  )
}

/**
 * Prop type for `PanelTab`.
 */
export interface TPanelTab_P {
  /**
   * The view associated with the tab.
   */
  view: TPanelView_P
}
