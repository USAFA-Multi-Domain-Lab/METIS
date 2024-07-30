import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/args'
import Arg from './Arg'
import './ArgGrouping.scss'

/**
 * Renders a group of arguments and their entry components based on the argument's type.
 */
export default function ArgGrouping({
  effect,
  target,
  grouping,
  effectArgs,
  setEffectArgs,
}: TArgGrouping_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * Boolean to determine if at least one argument
   * in the grouping is displayed based on the
   * dependencies of the arguments.
   */
  const oneGroupingIsDisplayed: boolean = compute(() => {
    // Default value.
    let oneGroupingIsDisplayed: boolean = false

    // Iterate through the arguments in the grouping.
    for (let arg of grouping) {
      // If all of the argument's dependencies are met
      // then at least one argument in the grouping
      // is displayed.
      if (target && target.allDependenciesMet(arg.dependencies, effectArgs)) {
        oneGroupingIsDisplayed = true
        break
      }
    }

    // Return the result.
    return oneGroupingIsDisplayed
  })

  /**
   * Class name for the grouping.
   */
  const rootClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['ArgGrouping']

    // If no arguments in the grouping are displayed
    // then hide the grouping.
    if (!oneGroupingIsDisplayed) {
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
            target={target}
            arg={arg}
            effectArgs={effectArgs}
            setEffectArgs={setEffectArgs}
            key={arg._id}
          />
        )
      })}
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
   * The effect's target.
   */
  target: ClientEffect['target']
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
  setEffectArgs: ReactSetter<ClientEffect['args']>
}
