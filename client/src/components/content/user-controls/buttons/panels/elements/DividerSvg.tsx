import ButtonSvgEngine from '../engines'
import { TDividerSvg_PK } from '../types'

export default function ({}: TDividerSvg_PK): TReactElement {
  return <div className='SvgPanelElement DividerSvg'></div>
}

/**
 * Creates new default props for when a new divider
 * is added to an engine.
 */
export function createDividerDefaults(): Required<
  Omit<TDividerSvg_PK, 'key' | 'type'>
> {
  return {
    ...ButtonSvgEngine.DEFAULT_ELEMENT_PROPS,
  }
}
