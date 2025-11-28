/**
 * A target available in the METIS target environment that enables a user
 * to send a message to the output panel of a force.
 */
const Output = new TargetSchema({
  _id: 'output',
  name: 'Output Panel',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { forceMetadata, message } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata
    let to = forceKey ? { forceKey } : undefined

    // Output the message to the force.
    context.sendOutput(message, to)
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
      groupingId: 'output',
    },
    {
      type: 'large-string',
      _id: 'message',
      name: 'Message',
      required: false,
      groupingId: 'output',
      dependencies: [TargetDependency.FORCE('forceMetadata')],
      tooltipDescription:
        `This is the message that will be displayed in the output panel for the force selected above.\n` +
        `\t\n` +
        `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
    },
  ],
})

export default Output
