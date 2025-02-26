import { ReactNode, useState } from 'react'
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
  label,
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
      <span className='Label'>{label}</span>
      <span className='Value'>{valueJsx}</span>
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
   * The label to display for the property.
   */
  label: string
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
