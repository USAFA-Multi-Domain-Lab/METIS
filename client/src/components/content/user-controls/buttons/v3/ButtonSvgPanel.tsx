import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import ButtonSvg from './ButtonSvg'
import ButtonSvgDivider from './ButtonSvgDivider'
import './ButtonSvgPanel.scss'
import { TButtonSvgPanel_P } from './types'

/**
 * A panel for displaying buttons with SVG icons.
 */
export default function ({ engine }: TButtonSvgPanel_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The classes for the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('ButtonSvgPanel')
      .set('PanelEmpty', !engine.panelElements.length)
      .switch({ row: 'FlowRow', column: 'FlowColumn' }, engine.flow)
      .switch('RevealLabels', 'HideLabels', engine.labelsRevealed),
  )

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      {engine.panelElements.map((element) => {
        switch (element.type) {
          case 'divider':
            return <ButtonSvgDivider {...element} />
          default:
            return <ButtonSvg {...element} />
        }
      })}
    </div>
  )
}
