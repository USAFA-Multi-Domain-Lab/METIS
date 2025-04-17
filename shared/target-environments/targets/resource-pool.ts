import { TTargetJson } from '.'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the resource pool.
 */
export const resourcePool: TTargetJson = {
  _id: 'resource-pool',
  targetEnvId: 'metis',
  name: 'Resource Pool',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    let { effect } = context
    let { modifier, forceMetaData } = effect.args
    let { forceId } = forceMetaData

    // Modify the resource pool.
    context.modifyResourcePool(modifier, { forceId })
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetaData',
      name: 'Force',
      required: true,
    },
    {
      type: 'number',
      _id: 'modifier',
      name: 'Modifier',
      required: true,
      default: 0,
      tooltipDescription:
        'The amount to add or subtract from the resource pool.',
    },
  ],
}

export default resourcePool
