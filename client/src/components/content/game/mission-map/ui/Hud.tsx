import ClientMission from 'src/missions'
import './Hud.scss'
import { ButtonSVGPanel } from 'src/components/content/user-controls/ButtonSVGPanel'
import { ButtonSVG } from 'src/components/content/user-controls/ButtonSVG'
import { useMemo } from 'react'
import { compute } from 'src/toolbox/'

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
    return <ButtonSVGPanel buttons={buttons} />
  })

  // Render root element.
  return (
    <div className='Hud'>
      <div className='Title'>{mission.name}</div>
      {buttonPanelJSX}
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
  buttons?: ButtonSVG[]
}
