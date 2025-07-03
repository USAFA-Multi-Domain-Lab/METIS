import { ReactNode, useState } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import ClientMissionAction from 'src/missions/actions'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import './ActionProperty.scss'

/**
 * Renders a property of a mission action for display.
 */
export default function ActionProperty<TKey extends keyof ClientMissionAction>({
  action,
  actionKey,
  cheatsApplied = false,
  infiniteResources = false,
  renderValue = (value) => value.toString(),
}: TActionProperty_P<TKey>): JSX.Element | null {
  /* -- STATE -- */

  const [value, setValue] = useState<ClientMissionAction[TKey]>(
    action[actionKey],
  )
  const [valueUpdated, setValueUpdated] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The class name for the action property.
   */
  const className = compute(() => {
    let classList = ['ActionProperty', `ActionProperty_${actionKey}`]

    // Add the updated class if the value has
    // been updated.
    if (valueUpdated) classList.push('Updated')
    // Add the 'CheatsApplied' class if the
    // value is disabled by cheats.
    if (cheatsApplied) classList.push('CheatsApplied')
    // Add the 'InfiniteResources' class if the
    // session has infinite resources enabled.
    if (infiniteResources) classList.push('InfiniteResources')

    return classList.join(' ')
  })

  /**
   * The style for the icon based on the action key.
   */
  const iconStyle: React.CSSProperties = compute(() => {
    let result: React.CSSProperties = {
      backgroundImage: 'linear-gradient(transparent, transparent)',
      backgroundSize: '0.65em',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }

    // Determine the icon based on the action key.
    let icon: TMetisIcon
    switch (actionKey) {
      case 'successChanceFormatted':
        icon = 'percent'
        break
      case 'processTimeFormatted':
        icon = 'timer'
        break
      case 'resourceCostFormatted':
        icon = 'coins'
        break
      case 'opensNodeFormatted':
        icon = 'door'
        break
      default:
        icon = '_blank'
    }

    result.backgroundImage = `url(${require(`../../../../../../../../assets/images/icons/${icon}.svg`)})`

    // Return the style for the icon.
    return result
  })

  /**
   * Describes the property being displayed.
   */
  const description: string = compute(() => {
    switch (actionKey) {
      case 'successChanceFormatted':
        return 'Success Chance'
      case 'processTimeFormatted':
        return 'Process Time'
      case 'resourceCostFormatted':
        return 'Resource Cost'
      case 'opensNodeFormatted':
        return 'Opens Node'
      default:
        return ''
    }
  })

  /**
   * The JSX for the value of the property.
   */
  const valueJsx = renderValue(value)

  /* -- EFFECTS -- */

  // Update the value when it changes.
  useEventListener(action.node, 'activity', () => {
    // Update the action's value.
    setValue((prev: ClientMissionAction[TKey]) => {
      // If the value has changed...
      if (prev !== action[actionKey]) {
        // ...set the updated state to true.
        setValueUpdated(true)
        // ...and reset the updated state after a delay
        setTimeout(() => setValueUpdated(false), 500)
        // ...and return the new value.
        return action[actionKey]
      }
      // Otherwise, return the previous value.
      return prev
    })
  })

  return (
    <div className={className}>
      <div className='Icon' style={iconStyle}>
        <Tooltip description={description} />
      </div>
      <span className='Value'>
        <Tooltip description={description} />
        {valueJsx}
      </span>
    </div>
  )
}

/* -- TYPES -- */

/**
 * The props for the `ActionProperty` component.
 */
export type TActionProperty_P<TKey extends keyof ClientMissionAction> = {
  /**
   * The action from which to extract and display the
   * property.
   */
  action: ClientMissionAction
  /**
   * The key of the property to display.
   */
  actionKey: TKey
  /**
   * Whether the property is disabled by cheats.
   * @default false
   */
  cheatsApplied?: boolean
  /**
   * Whether the session has infinite resources enabled.
   * @default false
   */
  infiniteResources?: boolean
  /**
   * Renders the value of the property.
   * @default (value) => value.toString()
   */
  renderValue?: (value: ClientMissionAction[TKey]) => ReactNode
}
