import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ButtonSvgPanel from 'src/components/content/user-controls/ButtonSvgPanel'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox/'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import './Hud.scss'

/**
 * HUD for the mission map.
 */
export default function Hud({
  mission,
  buttons = [],
}: THud): JSX.Element | null {
  /* -- render -- */

  /**
   * The JSX for the button panel.
   */
  const buttonPanelJSX: JSX.Element | null = compute((): JSX.Element | null => {
    // If no buttons were passed, do not render the panel.
    if (buttons.length === 0) return null

    // Otherwise, render the panel.
    return <ButtonSvgPanel buttons={buttons} size={'small'} />
  })

  // Render root element.
  return (
    <div className='Hud'>
      <div className='TitleBar'>
        <div className='Title'>{mission.name}</div>
        {buttonPanelJSX}
      </div>
    </div>
  )
}

/**
 * Props for `Hud` component.
 */
export type THud = {
  /**
   * The mission to display.
   */
  mission: ClientMission
  /**
   * The buttons to display.
   * @note If no buttons are passed, the button panel will not
   * be rendered.
   * @default []
   */
  buttons?: TWithKey<TButtonSvg>[]
}
