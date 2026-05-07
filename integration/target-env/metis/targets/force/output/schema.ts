/**
 * A target available in the METIS target environment that enables a user
 * to send a message to the output panel of a force.
 */
const Output = TargetSchema.create({
  _id: 'output',
  name: 'Output Panel',
  description: '',
  script: async (context, forceMetadata, message) => {
    // Extract the selected force (if any) from the mission-component argument.
    const [force] = forceMetadata
    const to = force ? { forceKey: force.localKey } : undefined

    // Output the message to the force.
    context.sendOutput(message ?? '', to)
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
      groupingId: 'output',
      validComponentTypes: ['force'] as const,
    },
    {
      type: 'large-string' as const,
      _id: 'message',
      name: 'Message',
      required: false,
      groupingId: 'output',
      dependencies: [TargetDependency.TRUTHY('forceMetadata')],
      tooltipDescription:
        `This is the message that will be displayed in the output panel for the force selected above.\n` +
        `\t\n` +
        `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
    },
  ],
})

export default Output
