import Tooltip from 'metis/client/components/content/communication/Tooltip'
import { compute } from 'metis/client/toolbox'
import { ClassList } from 'metis/toolbox'
import ButtonSvgEngine from '../engines'
import { TTextSvg_PK } from '../types'
import './TextSvg.scss'

/**
 * A component for displaying simple text for
 * a button-SVG panel.
 */
export default function ({
  value,
  size,
  bold,
  description,
  uniqueClassList,
  disabled,
  hidden,
}: TTextSvg_PK): TReactElement | null {
  /**
   * The classes used for the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList()
      .add('SvgPanelElement')
      .add('TextSvg')
      .switch(
        {
          small: 'TextSvgSmall',
          regular: 'TextSvgRegular',
          large: 'TextSvgLarge',
        },
        size,
      )
      .set('Disabled', disabled)
      .import(uniqueClassList),
  )

  const rootStyle = compute<React.CSSProperties>(() => {
    return {
      fontWeight: bold ? 'bold' : undefined,
    }
  })

  /* -- RENDER -- */

  if (hidden) return null

  return (
    <div className={rootClasses.value} style={rootStyle}>
      <div className='TextSvgValue'>{value}</div>
      <Tooltip description={description} />
    </div>
  )
}

/**
 * Creates new default props for when new text
 * is added to an engine.
 */
export function createTextDefaults(): Required<
  Omit<TTextSvg_PK, 'key' | 'type'>
> {
  return {
    ...ButtonSvgEngine.DEFAULT_ELEMENT_PROPS,
    value: '',
    size: 'regular',
    bold: false,
  }
}
