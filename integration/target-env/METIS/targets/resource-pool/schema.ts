import { TForceMetadata } from 'metis/target-environments/args/mission-component/force-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource pool.
 */
const ResourcePool = new TargetSchema({
  name: 'Resource Pool',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { modifier, forceMetadata } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata

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
      dependencies: [Dependency.FORCE('forceMetadata')],
      tooltipDescription:
        'The amount to add or subtract from the resource pool.',
    },
  ],
})

export default ResourcePool
