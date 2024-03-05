import './index.scss'

/**
 * An overlay to display on top of the mission map.
 * @note Useful for displaying modals.
 */
export default function Overlay({ children }: TOverlay): JSX.Element | null {
  /* -- computed -- */

  /* -- render -- */

  return <div className='Overlay'>{children}</div>
}

/**
 * Props for `Overlay` component.
 */
export type TOverlay = {
  /**
   * The nested JSX displayed in the overlay, presumably a modal.
   * @default undefined
   */
  children?: React.ReactNode
}
