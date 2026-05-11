/**
 * A target available in the METIS target environment that enables a user
 * to send a message to the output panel of a force.
 */
const Output = TargetSchema.create({
  _id: 'output',
  name: 'Output Panel',
  description: '',
  script: async (context, to, message = '') => {
    context.sendOutput(message, to)
  },
  parameters: [
    {
      // todo: Write migration from 'forceMetadata' to 'to'
      type: 'mission-component',
      _id: 'to',
      name: 'Force',
      required: true,
      groupingId: 'output',
      validComponentTypes: ['mission', 'force'],
      multiSelect: true,
    },
    {
      type: 'large-string',
      _id: 'message',
      name: 'Message',
      required: false,
      groupingId: 'output',
      dependencies: [TargetDependency.NOT_EMPTY('to')],
      tooltipDescription:
        `This is the message that will be displayed in the output panel for the force selected above.\n` +
        `\t\n` +
        `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
    },
  ],
})

export default Output
