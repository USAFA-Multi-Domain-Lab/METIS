import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'

import { TTargetArg } from '../../../../../../shared/target-environments/args'
import Divider from '../../form/Divider'
import Arg from './Arg'
import './ArgGrouping.scss'

/**
 * Renders a group of arguments and their entry components based on the argument's type.
 */
export default function ArgGrouping({
  effect,
  grouping,
  effectArgs,
  setEffectArgs,
}: TArgGrouping_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * Whether the grouping is currently hidden from view.
   * @note The grouping is hidden if none of the arguments
   * in the grouping are ready to be displayed.
   */
  const hidden: boolean = compute(() => {
    // Default value.
    let result: boolean = true

    // Iterate through the arguments in the grouping.
    for (let arg of grouping) {
      // If all of the argument's dependencies are met
      // then at least one argument in the grouping
      // is displayed.
      if (effect.allDependenciesMet(arg.dependencies, effectArgs)) {
        result = false
        break
      }
    }

    // Return the result.
    return result
  })

  /**
   * Class name for the grouping.
   */
  const rootClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['ArgGrouping']

    // If no arguments in the grouping are displayed
    // then hide the grouping.
    if (hidden) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })

  /* -- RENDER -- */
  return (
    <div className={rootClassName}>
      {grouping.map((arg) => {
        return (
          <Arg
            effect={effect}
            arg={arg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
            key={arg._id}
          />
        )
      })}
      <Divider />
    </div>
  )
}

/* ---------------------------- TYPES FOR ARG GROUPING ---------------------------- */

/**
 * The props for the `ArgGrouping` component.
 */
type TArgGrouping_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The grouping of arguments to render.
   */
  grouping: TTargetArg[]
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: TReactSetter<ClientEffect['args']>
}
