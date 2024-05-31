import { TButtonSvg } from 'src/components/content/user-controls/ButtonSvg'
import ButtonSvgPanel from 'src/components/content/user-controls/ButtonSvgPanel'
import { TWithKey } from '../../../../../../../shared/toolbox/objects'
import './TitleBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({
  title,
  buttons = [],
}: TTitleBar_P): JSX.Element | null {
  /* -- STATE -- */

  /* -- COMPUTED -- */

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className='TitleBar'>
      <div className='Title'>{title}</div>
      <ButtonSvgPanel buttons={buttons} size={'small'} />
    </div>
  )
}

/**
 * Props for `TabBar`.
 */
export type TTitleBar_P = {
  /**
   * The title to display.
   */
  title: string
  /**
   * The buttons to display.
   * @default []
   */
  buttons?: TWithKey<TButtonSvg>[]
}
