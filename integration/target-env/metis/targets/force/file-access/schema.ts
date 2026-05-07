/**
 * A target available in the METIS target environment that
 * allows a user to manage access to files from forces.
 */
const FileAccess = TargetSchema.create({
  _id: 'file-access',
  name: 'File Access',
  description: '',
  script: async (context, forceMetadata, fileMetadata, access) => {
    // Extract the selected force and file from the mission-component arguments.
    const [force] = forceMetadata
    const [file] = fileMetadata

    // Throw an error if the file or force is missing.
    if (!file || !force) {
      throw new Error('File or Force is missing.')
    }

    // Realize effect based on the value of "access".
    switch (access) {
      case 'granted':
        context.grantFileAccess(file._id, force.localKey)
        break
      case 'revoked':
        context.revokeFileAccess(file._id, force.localKey)
        break
      case 'no-change':
      default:
        break
    }
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
      validComponentTypes: ['force'] as const,
    },
    {
      type: 'mission-component' as const,
      _id: 'fileMetadata',
      name: 'File',
      required: true,
      validComponentTypes: ['missionFile'] as const,
    },
    {
      type: 'dropdown' as const,
      _id: 'access',
      name: 'Access',
      required: true,
      dependencies: [
        TargetDependency.TRUTHY('forceMetadata'),
        TargetDependency.TRUTHY('fileMetadata'),
      ],
      options: [
        {
          _id: 'no-change',
          name: 'No Change',
          value: 'no-change',
        },
        { _id: 'granted', name: 'Granted', value: 'granted' },
        { _id: 'revoked', name: 'Revoked', value: 'revoked' },
      ],
      default: { _id: 'no-change', name: 'No Change', value: 'no-change' },
      tooltipDescription:
        'Grants or revokes access to the file for the force. If no change is selected, then the access will be left unmodified.',
    },
  ],
})

export default FileAccess
