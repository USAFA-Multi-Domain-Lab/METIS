import { compute } from 'src/toolbox'
import { removeKey } from 'src/toolbox/components'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import './ButtonSvgPanel.scss'
import ButtonSvg from './elements/ButtonSvg'
import DividerSvg from './elements/DividerSvg'
import StepperSvg from './elements/StepperSvg'
import TextSvg from './elements/TextSvg'
import { TButtonSvgPanel_P, TSvgPanelElement } from './types'

/**
 * A panel for displaying buttons with SVG icons.
 */
export default function ({
  engine: { panelElements, flow, labelsRevealed },
}: TButtonSvgPanel_P): TReactElement | null {
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
  const renderElement = (element: TSvgPanelElement): TReactElement | null => {
    let key = element.key

    switch (element.type) {
      case 'button':
        return <ButtonSvg key={key} {...removeKey(element)} />
      case 'text':
        return <TextSvg key={key} {...removeKey(element)} />
      case 'stepper':
        return <StepperSvg key={key} {...removeKey(element)} />
      case 'divider':
        return <DividerSvg key={key} {...removeKey(element)} />
      default:
        // If the type is not recognized, return null
        console.warn(
          `Unrecognized element type: ${(element as TSvgPanelElement)?.type}`,
        )
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
