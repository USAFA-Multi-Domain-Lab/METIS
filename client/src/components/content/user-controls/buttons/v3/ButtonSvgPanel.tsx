import { compute } from 'src/toolbox'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import SvgButton from './button-svg'
import ButtonSvg from './ButtonSvg'
import './ButtonSvgPanel.scss'
import SvgDivider from './divider-svg'
import DividerSvg from './DividerSvg'
import SvgStepper from './stepper-svg'
import StepperSvg from './StepperSvg'
import { TButtonSvgPanel_P, TSvgPanelElement } from './types'

/**
 * A panel for displaying buttons with SVG icons.
 */
export default function ({
  engine: { panelElements, flow, labelsRevealed },
}: TButtonSvgPanel_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The classes for the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('ButtonSvgPanel')
      .set('PanelEmpty', !panelElements.length)
      .switch({ row: 'FlowRow', column: 'FlowColumn' }, flow)
      .switch('RevealLabels', 'HideLabels', labelsRevealed),
  )

  /* -- FUNCTIONS -- */

  /**
   * Renders a panel element based on its type.
   * @param element The element to render.
   * @returns The rendered JSX element or null if not recognized.
   */
  const renderElement = (element: TSvgPanelElement): JSX.Element | null => {
    if (element instanceof SvgButton) {
      return <ButtonSvg {...element.toProps()} />
    } else if (element instanceof SvgStepper) {
      return <StepperSvg {...element.toProps()} />
    } else if (element instanceof SvgDivider) {
      return <DividerSvg {...element.toProps()} />
    } else {
      return null
    }
  }

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      {panelElements.map((element) => renderElement(element))}
    </div>
  )
}
