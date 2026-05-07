import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import Divider from '../../../../content/form/Divider'
import { useMissionPageContext } from '../../context'
import TargetArgumentDetail from './TargetArgumentDetail'
import './TargetArgumentGrouping.scss'

/**
 * Renders a group of parameters and their entry components
 * based on the parameter's type.
 */
export default function TargetArgumentGrouping({
  grouping,
}: TTargetArgumentGrouping_P): TReactElement | null {
  const { viewMode } = useMissionPageContext()

  /* -- COMPUTED -- */

  /**
   * Whether the grouping is currently hidden from view.
   * @note The grouping is hidden if none of the parameters
   * in the grouping are ready to be displayed.
   */
  const hidden: boolean = compute(() => {
    // Default value.
    let result: boolean = true

    // Iterate through the arguments in the grouping.
    for (let argument of grouping) {
      // If all of the argument's dependencies are met
      // then at least one argument in the grouping
      // is displayed.
      if (
        argument.parameter &&
        argument.effect.allDependenciesMet(argument.parameter.dependencies)
      ) {
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
    let classList = new ClassList('TargetArgumentGrouping')

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
      {grouping.map((argument) => {
        return <TargetArgumentDetail argument={argument} key={argument._id} />
      })}
      <Divider />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link TargetArgumentGrouping}.
 */
type TTargetArgumentGrouping_P = {
  /**
   * The grouping of arguments to render.
   */
  grouping: ClientTargetArgument[]
}
