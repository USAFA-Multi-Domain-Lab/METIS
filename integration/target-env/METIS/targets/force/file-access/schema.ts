import { TFileMetadata } from 'metis/target-environments/args/mission-component/file-arg'
import { TForceMetadata } from 'metis/target-environments/args/mission-component/force-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetMigrationRegistry from 'metis/target-environments/targets/migrations/registry'
import TargetSchema from '../../../../../library/target-env-classes/targets'

/**
 * Migrations for the File Access target.
 */
const migrations = new TargetMigrationRegistry().register(
  '0.2.0',
  (effectArgs) => {
    console.log('Migrating File Access effect args to version 0.2.0.')
    // effectArgs.test = 'This is a test value for the migration.'
    return effectArgs
  },
)

/**
 * A target available in the METIS target environment that
 * allows a user to manage access to files from forces.
 */
const FileAccess = new TargetSchema({
  name: 'File Access',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { fileMetadata, forceMetadata, access } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata
    const { fileId } = fileMetadata as TFileMetadata

    // Throw an error if the file ID or force key is missing.
    if (!fileId || !forceKey) {
      throw new Error('File ID or Force Key is missing.')
    }

    // Realize effect based on the value of "access".
    switch (access) {
      case 'granted':
        context.grantFileAccess(fileId, forceKey)
        break
      case 'revoked':
        context.revokeFileAccess(fileId, forceKey)
        break
      case 'no-change':
      default:
        break
    }
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
    },
    {
      type: 'file',
      _id: 'fileMetadata',
      name: 'File',
      required: true,
    },
    {
      type: 'dropdown',
      _id: 'access',
      name: 'Access',
      required: true,
      dependencies: [
        Dependency.FORCE('forceMetadata'),
        Dependency.FILE('fileMetadata'),
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
