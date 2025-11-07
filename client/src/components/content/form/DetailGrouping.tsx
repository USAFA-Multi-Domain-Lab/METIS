import type { ReactNode } from 'react'
import './DetailGrouping.scss'

export default function DetailGrouping({
  children,
  label = '',
}: TDetailGrouping_P) {
  /* -- RENDER -- */
  return <div className='DetailGrouping'>{children}</div>
}

/**
 * The props for `DetailGrouping`.
 */
export type TDetailGrouping_P = {
  /**
   * The children to render.
   */
  children?: ReactNode
  /**
   * The label for the grouping.
   * @default ''
   */
  label?: string
}
