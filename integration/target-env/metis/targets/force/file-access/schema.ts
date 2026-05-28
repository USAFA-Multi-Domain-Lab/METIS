import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that
 * allows a user to manage access to files from forces.
 */
const FileAccess = TargetSchema.create({
  _id: 'file-access',
  name: 'File Access',
  description: '',
  script: async (context, applyTo, files, access) => {
    if (access === 'no-change') return
    context.updateFileAccess(applyTo, files, access === 'granted')
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Apply To',
      groupingId: 'main',
      validComponentTypes: ['mission', 'force'],
    },
    {
      type: 'mission-component',
      _id: 'files',
      name: 'File',
      groupingId: 'main',
      validComponentTypes: ['missionFile'],
      dependencies: [TargetDependency.NOT_EMPTY('applyTo')],
    },
    {
      type: 'dropdown',
      _id: 'access',
      name: 'Access',
      groupingId: 'main',
      required: true,
      dependencies: [
        TargetDependency.NOT_EMPTY('applyTo'),
        TargetDependency.NOT_EMPTY('files'),
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
  migrations,
})

export default FileAccess
