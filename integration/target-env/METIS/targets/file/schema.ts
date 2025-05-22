import { TForceMetadata } from 'metis/target-environments/args/mission-component/force-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that
 * allows a user to manage access to files from forces.
 */
const ResourcePool = new TargetSchema({
  name: 'File',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    const { effect } = context
    const { fileMetadata, forceMetadata } = effect.args
    const { forceKey } = forceMetadata as TForceMetadata
    const { fileId } = fileMetadata

    // todo: Add access control here for files.
    // context.modifyResourcePool(modifier, { forceKey })
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
})

export default ResourcePool
