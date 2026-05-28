import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the success chance of a specific action within a node or
 * all actions within a node.
 */
const SuccessChanceMod = TargetSchema.create({
  _id: 'success-chance-mod',
  name: 'Success Chance Modifier',
  description: '',
  script: async (context, applyTo, amount) => {
    context.modifySuccessChance(applyTo, amount / 100)
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Apply To',
      groupingId: 'main',
      validComponentTypes: ['mission', 'force', 'node', 'action'],
    },
    {
      type: 'number',
      _id: 'amount',
      name: 'Modifier Amount',
      required: true,
      min: -100,
      max: 100,
      unit: '%',
      groupingId: 'main',
      dependencies: [TargetDependency.NOT_EMPTY('applyTo')],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the chance of success for all actions within the node. A positive value increases the chance of success, while a negative value decreases the chance of success.\n` +
        `\t\n` +
        `For example, if the chance of success is 50% and you set the chance of success to +10%, then the chance of success will be 60%.\n` +
        `\t\n` +
        `*Note: If the result is less than 0%, then the chance of success will be 0%. If the result is greater than 100%, then the chance of success will be 100%.*`,
    },
  ],
  migrations,
})

export default SuccessChanceMod
