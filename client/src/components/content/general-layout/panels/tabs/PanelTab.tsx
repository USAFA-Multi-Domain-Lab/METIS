import Tooltip from '@client/components/content/communication/Tooltip'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import If from '@client/components/content/util/If'
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
  const iconEngine = useButtonSvgEngine({
    elements: view.icon
      ? [
          {
            key: 'tab-icon',
            type: 'button',
            icon: view.icon,
            cursor: view.disabled ? 'not-allowed' : 'pointer',
            disabled: view.disabled,
          },
        ]
      : [],
  })

  /* -- EFFECTS -- */

  /**
   * The class names of the root element of the
   * component.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('PanelTab')
    result.set('Selected', view.title === selectedView?.title)
    result.set('PartiallyDisabled', view.disabled === true)
    result.set('Highlighted', view.highlighted === true)
    return result
  })

  /* -- FUNCTIONS -- */

  /**
   * Callback for when the root element is clicked.
   */
  const onClick = () => {
    // Prevent selection if disabled
    if (view.disabled) return
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
      <If condition={view.icon}>
        <div className='TabIcon'>
          <ButtonSvgPanel engine={iconEngine} />
        </div>
      </If>
      <If condition={view.title}>
        <div className='TabTitle'>{view.title}</div>
      </If>
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
