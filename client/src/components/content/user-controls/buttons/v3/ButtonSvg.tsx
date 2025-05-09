import React from 'react'
import { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { TDefaultProps, useDefaultProps } from 'src/toolbox/hooks'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import Tooltip from '../../../communication/Tooltip'
import './ButtonSvg.scss'
import { TButtonSvg_PK } from './types'

/* -- CONSTANTS -- */

/**
 * The default props for the `ButtonSvg` component.
 */
export const defaultButtonSvgProps: TDefaultProps<TButtonSvg_PK> = {
  icon: 'options',
  description: null,
  label: null,
  uniqueClassList: [],
  disabled: false,
  disabledBehavior: 'gray-out',
  alwaysShowTooltip: false,
  cursor: 'pointer',
  permissions: [],
  onClick: () => {},
  onCopy: () => {},
}

/* -- COMPONENTS -- */

/**
 * A button with an SVG icon.
 */
export default function (props: TButtonSvg_PK): JSX.Element | null {
  /* -- PROPS -- */

  const {
    icon,
    description,
    label,
    uniqueClassList,
    disabled,
    disabledBehavior,
    alwaysShowTooltip,
    cursor,
    permissions,
    onClick,
    onCopy,
  } = useDefaultProps(props, defaultButtonSvgProps)

  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [login] = globalContext.login

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
   * The class for the root element.
   */
  const rootClass = compute<ClassList>(() => {
    let result = new ClassList('ButtonSvg_v3', `ButtonSvg_${icon}`)
      .switch('WithLabel', 'WithoutLabel', label)
      .switch('Authorized', 'Unauthorized', isAuthorized)
      .set('AlwaysShowTooltip', alwaysShowTooltip)
      .switch(
        { 'gray-out': 'GrayOutIfDisabled', 'hide': 'HideIfDisabled' },
        disabledBehavior,
      )
      .set('Disabled', disabled)

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
    if (icon !== '_blank') {
      result.backgroundImage = `url(${require(`../../../../../assets/images/icons/${icon}.svg`)})`
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
