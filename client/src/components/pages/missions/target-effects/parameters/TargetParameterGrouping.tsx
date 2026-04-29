import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import type { TTargetParameter } from '@shared/target-environments/parameters/TargetParameter'
import { ClassList } from '@shared/toolbox/html/ClassList'
import Divider from '../../../../content/form/Divider'
import { useMissionPageContext } from '../../context'
import TargetParameter from './TargetParameter'
import './TargetParameterGrouping.scss'

/**
 * Renders a group of arguments and their entry components based on the argument's type.
 */
export default function TargetParameterGrouping({
  effect,
  grouping,
  targetArguments,
  setTargetArguments,
}: TTargetParameterGrouping_P): TReactElement | null {
  const { viewMode } = useMissionPageContext()

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
      if (effect.allDependenciesMet(arg.dependencies, targetArguments)) {
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
    let classList = new ClassList('ArgGrouping')

    // If no arguments in the grouping are displayed
    // then hide the grouping.
    if (hidden) classList.add('Hidden')

    // If the view mode is preview then
    // disable it so that the user cannot
    // edit the arguments.
    if (viewMode === 'preview') classList.add('Disabled')

    return classList.value
  })

  /* -- RENDER -- */
  return (
    <div className={rootClassName}>
      {grouping.map((arg) => {
        return (
          <Arg
            effect={effect}
            arg={arg}
            targetArguments={targetArguments}
            setTargetArguments={setTargetArguments}
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
type TTargetParameterGrouping_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The grouping of arguments to render.
   */
  grouping: TTargetParameter[]
  /**
   * The arguments that the effect uses to modify the target.
   */
  targetArguments: ClientEffect['arguments']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setTargetArguments: TReactSetter<ClientEffect['arguments']>
}
