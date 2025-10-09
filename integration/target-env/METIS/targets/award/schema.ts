import { NumberToolbox } from 'library/toolbox'
import { TForceMetadata } from 'metis/target-environments/args/mission-component/force-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to receive an award to their resource pool.
 */
const Award = new TargetSchema({
  name: 'Award',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { modifier, forceMetadata } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata

    // Set the error message.
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    if (!NumberToolbox.isNonNegative(modifier)) {
      throw new Error(
        `${errorMessage}\n` + `Modifier must be a positive number.`,
      )
    }

    // Modify the resource pool.
    context.modifyResourcePool(modifier, { forceKey })
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
    },
    {
      type: 'number',
      _id: 'modifier',
      name: 'Modifier',
      required: true,
      default: 0,
      min: 0,
      dependencies: [Dependency.FORCE('forceMetadata')],
      tooltipDescription: 'The amount to add to the resource pool.',
    },
  ],
})

export default Award
