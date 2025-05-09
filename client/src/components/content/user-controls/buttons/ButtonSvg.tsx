import React from 'react'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../shared/toolbox/html/class-lists'
import { TWithKey } from '../../../../../../shared/toolbox/objects'
import Tooltip from '../../communication/Tooltip'
import './ButtonSvg.scss'

/* -- components -- */

/**
 * A button with an SVG icon.
 * @deprecated In favor of `ButtonSvg_v3`.
 */
export default function ButtonSvg({
  type,
  description = null,
  label = null,
  uniqueClassList = [],
  disabled = 'none',
  cursor = 'pointer',
  onClick,
  onCopy = () => {},
}: TButtonSvg_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute<ClassList>(() => {
    let result = new ClassList(
      'ButtonSvg',
      `ButtonSvg_${type}`,
      !!label ? 'WithLabel' : 'WithoutLabel',
    )

    result.set('Disabled', disabled === 'full')
    result.set('PartiallyDisabled', disabled === 'partial')

    if (uniqueClassList instanceof ClassList) {
      result.add(...uniqueClassList.classes)
    } else {
      result.add(...uniqueClassList)
    }

    return result
  })

  /**
   * The style for the root element.
   */
  const rootStyle = compute((): React.CSSProperties => {
    // Construct result.
    let result: React.CSSProperties = {
      backgroundImage: 'linear-gradient(transparent, transparent)',
      backgroundSize: '0.65em',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }

    // If the type is not '_blank', import the SVG
    // and set it as the background image.
    if (type !== '_blank') {
      result.backgroundImage = `url(${require(`../../../../assets/images/icons/${type}.svg`)})`
    }

    // If a cursor is provided, use it.
    if (cursor) {
      result.cursor = cursor
    }

    // Return result.
    return result
  })

  /* -- RENDER -- */

  /**
   * The JSX for the description.
   */
  const descriptionJsx = compute<JSX.Element | null>(() => {
    if (!label && !!description) {
      return <Tooltip description={description} />
    } else if (!!label && !description) {
      return (
        <div className='ButtonLabel'>
          <div className='ButtonLabelText'>{label}</div>
        </div>
      )
    } else if (!!label && !!description) {
      return (
        <>
          <div className='ButtonLabel'>
            <div className='ButtonLabelText'>{description}</div>
          </div>
          <Tooltip description={description} />
        </>
      )
    } else {
      return null
    }
  })

  return (
    <div
      className={rootClass.value}
      style={rootStyle}
      onClick={onClick}
      onCopy={onCopy}
    >
      {descriptionJsx}
    </div>
  )
}

/* -- types -- */

/**
 * The different ways a button can be disabled.
 */
export type TButtonSvgDisabled = 'partial' | 'full' | 'none'

/**
 * Props for `ButtonSVG` component.
 */
export type TButtonSvg_P = {
  /**
   * The type of button.
   */
  type: TButtonSvgType
  /**
   * The description for the button.
   * @default null
   */
  description?: string | null
  /**
   * The label for the button.
   * @note This will be displayed beside the icon at all
   * times.
   * @default null
   */
  label?: string | null
  /**
   * Unique class lists to apply to the component.
   * @default []
   */
  uniqueClassList?: string[] | ClassList
  /**
   * The disabled state of the button.
   * @default 'none'
   */
  disabled?: TButtonSvgDisabled
  /**
   * Cursor styling used for the button.
   * @default 'pointer'
   */
  cursor?: string
  /**
   * Handles the click event for the button.
   * @param event The click event.
   */
  onClick: (event: React.MouseEvent) => void
  /**
   * Callback for a clipboard copy event.
   * @param event The clipboard event.
   * @default () => {}
   */
  onCopy?: (event: React.ClipboardEvent) => void
}

/**
 * Props for `ButtonSVG` component with a key.
 */
export type TButtonSvg_PK = TWithKey<TButtonSvg_P>

/**
 * The type of button being used.
 * @note Used to determine the icon to display.
 * ### Special Types
 * - `'_blank'`: Does not do anything and cannot be seen.
 * Acts as a filler when the space needs to be
 * filled up, but no button is required.
 */
export type TButtonSvgType = TMetisIcon
