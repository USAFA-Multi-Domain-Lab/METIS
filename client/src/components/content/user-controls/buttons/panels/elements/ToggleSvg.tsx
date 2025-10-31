import React from 'react'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { getIconPath } from 'src/toolbox/icons'
import ClassList from '../../../../../../../../shared/toolbox/html/class-lists'
import Tooltip from '../../../../communication/Tooltip'
import ButtonSvgEngine from '../engines'
import { TToggleSvg_PK } from '../types'
import './ButtonSvg.scss'

/* -- CONSTANTS -- */

/* -- COMPONENTS -- */

/**
 * A button with an SVG icon.
 */
export default function ({
  icon,
  description,
  label,
  initialValue,
  uniqueClassList,
  disabled,
  hidden,
  alwaysShowTooltip,
  cursor,
  permissions,
  onChange,
}: TToggleSvg_PK): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [login] = globalContext.login
  const [value, setValue] = React.useState<boolean>(initialValue)

  /* -- COMPUTED -- */

  /**
   * Whether the logged-user is authorized to
   * use the button.
   */
  const isAuthorized = compute<boolean>(() => {
    if (!login) return !permissions.length
    else return login.user.isAuthorized(permissions)
  })

  /**
   * The classes used for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    return new ClassList()
      .add('SvgPanelElement')
      .add('ToggleSvg')
      .add(`ToggleSvg_${icon}`)
      .switch('WithLabel', 'WithoutLabel', label)
      .set('AlwaysShowTooltip', alwaysShowTooltip)
      .set('Disabled', disabled)
      .import(uniqueClassList)
  })

  /**
   * The dynamic styling for the root element.
   */
  const rootStyle = compute((): React.CSSProperties => {
    // Construct result.
    let result: React.CSSProperties = {}

    // If a cursor is provided, use it.
    if (cursor) {
      result.cursor = cursor
    }

    // Return result.
    return result
  })

  /**
   * The dynamic styling for the icon.
   */
  const iconStyle = compute<React.CSSProperties>(() => {
    // Construct result.
    let result: React.CSSProperties = {
      backgroundImage: 'linear-gradient(transparent, transparent)',
      backgroundSize: '0.65em',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }

    // If the type is not '_blank', import the SVG
    // and set it as the background image.
    if (icon !== '_blank') {
      const url = getIconPath(icon)
      if (url) result.backgroundImage = `url(${url})`
    }

    return result
  })

  /**
   * The description to display in the tooltip.
   */
  const tooltipDescription = compute((): string => {
    let result: string = ''
    result += label
    if (result) result += '\n'
    result += description
    return result
  })

  /* -- RENDER -- */

  // If the user is unauthorized to use the button,
  // or if the button is explicitly hidden, return null.
  if (!isAuthorized || hidden) return null

  return (
    <div
      className={rootClasses.value}
      style={rootStyle}
      onClick={() => {
        if (disabled) return
        setValue(!value)
      }}
    >
      <div className='ToggleSvgIcon' style={iconStyle}></div>
      <div className='ToggleSvgLabel'>
        <div className='ToggleLabelText'>{label}</div>
      </div>
      <Tooltip description={tooltipDescription} />
    </div>
  )
}

/**
 * Creates new default props for when a new toggle
 * is added to an engine.
 */
export function createButtonDefaults(): Required<
  Omit<TToggleSvg_PK, 'key' | 'type'>
> {
  return {
    ...ButtonSvgEngine.DEFAULT_ELEMENT_PROPS,
    icon: 'options',
    label: '',
    initialValue: false,
    alwaysShowTooltip: false,
    cursor: 'pointer',
    permissions: [],
    onChange: (value: boolean) => {},
  }
}
