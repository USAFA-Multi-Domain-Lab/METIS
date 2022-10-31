import mongoose from 'mongoose'
import { MONGO_HOST } from '../config'
import missionModel from './models/model-mission'
import userModel from './models/model-user'

let connection: mongoose.Connection

// This will ensure that the data that by
// default should be in the database exists.
export function ensureDefaultDataExists(): void {
  // Create admin user if it doesn't exist
  userModel.findOne({ userID: 'admin' }).exec((error: Error, user: any) => {
    if (user === null) {
      console.log('Admin user not found.')
      console.log('Creating admin user...')

      const adminUserData = {
        userID: 'admin',
        firstName: 'N/A',
        lastName: 'N/A',
        password: 'temppass',
      }

      //creates and saves user
      userModel.create(adminUserData, (error: Error, adminUser: any) => {
        if (error) {
          console.error('Failed to create admin user:')
          console.error(error)
        } else {
          console.log('Admin user created:', adminUser.userID)
        }
      })
    }
  })

  // Create incredible mission if it
  // doesn't exist.
  missionModel
    .findOne({ name: 'Incredible Mission' })
    .exec((error: Error, mission: any) => {
      if (mission === null) {
        console.log('"Incredible Mission" not found.')
        console.log('Creating "Incredible Mission"...')

        const incredibleMissionData = {
          name: 'Incredible Mission',
          versionNumber: 1,
          seed: '980238470934',
          nodeStructure: {
            '1': {
              '2': { '3': { '4': { END: 'END' } } },
              '5': { '6': { '7': { END: 'END' } } },
              '8': { '9': { '10': { END: 'END' } } },
              '11': { '12': { '13': { END: 'END' } } },
            },
            '14': {
              '15': { '16': { '17': { END: 'END' }, '18': { END: 'END' } } },
            },
            '19': {
              '20': { '21': { END: 'END' }, '22': { END: 'END' } },
              '23': { '24': { END: 'END' } },
              '25': { '26': { END: 'END' } },
              '27': { '28': { END: 'END' }, '29': { END: 'END' } },
            },
            '30': {
              '31': { END: 'END' },
              '32': { END: 'END' },
              '33': { END: 'END' },
              '34': { END: 'END' },
            },
          },
          nodeData: [
            {
              nodeID: '1',
              name: 'Communications',
              color: 'green',
              preExecutionText: '',
              postExecutionSuccessText: '',
              postExecutionFailureText: '',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '13c8e7d8-9be6-4e05-ac98-134967ded155',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '3d33abca-0f6f-4572-8f9e-8811359160e9',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '46be848e-3c76-4475-a0d5-6a1bf79013f4',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '1115d8b4-6929-4842-af53-e218eb57b2a4',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '569c9409-6b2e-4d32-91ec-fb01644264eb',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '2b44a09f-5128-48da-afa4-990fd3d37211',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 0,
              mapY: -3,
            },
            {
              nodeID: '2',
              name: 'Cellular Network',
              color: 'green',
              preExecutionText: 'Cellular Network has not been executed.',
              postExecutionSuccessText: 'Cellular Network succeeded.',
              postExecutionFailureText: 'Cellular Network failed.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '51f623c7-a076-40dd-ac0e-bc0579730638',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '840399e6-0343-4676-a721-22c2c6fa21be',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'bc31da91-928e-493c-8edd-0ca92c04870f',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '2dd1bd93-d6ea-41ed-a7c2-69dacdd9dd19',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '2d5b26a0-2963-4980-8bfb-8f7bb132327e',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '27025a3e-62ee-4a2c-8b2d-92293beba72e',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: -5,
            },
            {
              nodeID: '5',
              name: 'Internet Provider',
              color: 'green',
              preExecutionText: 'Internet Provider has not been executed.',
              postExecutionSuccessText: 'Internet Provider has been executed.',
              postExecutionFailureText:
                'Internet Provider has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'e106b445-5bf0-411f-a49d-572669c417cb',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'fb9f702b-fa8f-4314-9e14-b1fba5a62425',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '4896fb1b-9656-4ae2-bf13-b5293932b936',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'b6fd19d6-e42f-4da6-bab4-ea7bec2f0fb1',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '9faabb93-1678-40e0-99b8-3de42cda4136',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '7f9a2ebd-f28f-4616-a9ca-c8ddf383d098',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: -4,
            },
            {
              nodeID: '8',
              name: 'Instant Messaging',
              color: 'green',
              preExecutionText: 'Instant Messaging has not been executed.',
              postExecutionSuccessText: 'Instant Messaging has been executed.',
              postExecutionFailureText:
                'Instant Messaging has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'e60c6d72-2d90-4ed6-a028-1e507a80918e',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '517fb952-316e-489b-98a2-3dc661572c61',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '06c89ad1-f434-4fae-8f3a-42da1d63092c',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '9430a7eb-1acc-42bb-b4b9-def07281cd4e',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'c5de503b-112e-4122-a5b8-39f5d2875f6a',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '4a7d197f-4141-4720-af17-718b93b8e91a',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: -3,
            },
            {
              nodeID: '11',
              name: 'File Sharing Service',
              color: 'green',
              preExecutionText: 'File Sharing Service has not been executed.',
              postExecutionSuccessText:
                'File Sharing Service has been executed.',
              postExecutionFailureText:
                'File Sharing Service has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '7386ca9e-92ff-4091-8c87-2b6a6e856a55',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'eaccba96-ad61-48b4-8332-87399587ae9d',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'f1ce8896-f7ce-4973-859f-9b7c02dd8caf',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '89c87555-529d-4780-a2ca-e2515141b15c',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'd3799688-c263-46cf-ab36-ee20518f2b49',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '2d2cf7df-e3c3-4344-963b-3517f344b3a9',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: -2,
            },
            {
              nodeID: '3',
              name: 'Callbank Cellular',
              color: 'green',
              preExecutionText: 'Callbank Cellular has not been executed.',
              postExecutionSuccessText: 'Callbank Cellular has been executed.',
              postExecutionFailureText:
                'Callbank Cellular has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'bff0132f-e284-44c6-9e2e-6d286277097c',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'd7586633-4808-4d31-bf57-3c9d9cdf3b07',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'b86a8e35-ee98-46d2-be76-00b4e228e88c',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '814c70f4-111c-485f-a14a-b8f48de1c980',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '51f1a959-b0a2-4533-aee6-84dddf488277',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'd7a58860-3ab6-48aa-9d57-a5f4e5304150',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 3,
              mapY: -5,
            },
            {
              nodeID: '6',
              name: 'Service Provider',
              color: 'green',
              preExecutionText: 'Service Provider has not been executed.',
              postExecutionSuccessText: 'Service Provider has been executed.',
              postExecutionFailureText:
                'Service Provider has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '0dadf4d9-cc2e-4f34-a02c-350833a6dcc7',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'be6521e7-ca71-46c7-9a61-42dbffced96a',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'a6f863df-407c-4d46-ac38-68c7574274ba',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
              ],
              mapX: 3,
              mapY: -4,
            },
            {
              nodeID: '9',
              name: 'Service Provider',
              color: 'green',
              preExecutionText: 'Service Provider has not been executed.',
              postExecutionSuccessText: 'Service Provider has been executed.',
              postExecutionFailureText:
                'Service Provider has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'b1688df2-40ad-47ec-9bf4-88c81d0dc67d',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '4d0d935a-022f-4276-87b1-f2f0b0449ddf',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'b4258421-9178-4c40-af92-486e0ddb1e54',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '51a25aee-b66e-42f1-93a6-30659bcf0714',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '0b3de085-464c-4416-bc85-6fb278824042',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '415ac79b-13c3-4862-99ea-afba90762463',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 3,
              mapY: -3,
            },
            {
              nodeID: '12',
              name: 'Service Provider',
              color: 'green',
              preExecutionText: 'Service Provider has not been executed.',
              postExecutionSuccessText: 'Service Provider has been executed.',
              postExecutionFailureText:
                'Service Provider has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '21074efc-e0d3-4068-b032-622b05ad2d50',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '6dffeb1c-edec-4889-90af-74265a383d30',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'c5ebde3f-13a6-4353-be4d-e1bbb22dec32',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '665da164-58e4-4baf-8d76-df776ad71bca',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '65cc9e96-ae9d-44ca-8c17-d47bd8d065aa',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'dba4f7fb-c206-49e7-ab50-f3f237d6cb4e',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 3,
              mapY: -2,
            },
            {
              nodeID: '4',
              name: 'Cellular Towers',
              color: 'green',
              preExecutionText: 'Cellular Towers has not been executed.',
              postExecutionSuccessText: 'Cellular Towers has been executed.',
              postExecutionFailureText:
                'Cellular Towers has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '02cfa229-4d2a-4dd3-9bb3-bf2b13d84815',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'cf2df2a5-b828-4df3-bac2-7e89d76c4601',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'a07994f5-a807-41bc-9647-b5ac5951dc40',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '074c3d78-3d98-487d-8d34-5685829ecab2',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'b5e49fca-dc9c-4bb1-875e-7f5033f0cb04',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '35cf34b3-86e6-40e6-86aa-f050cf3376e2',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 4,
              mapY: -5,
            },
            {
              nodeID: '7',
              name: 'Main Server',
              color: 'green',
              preExecutionText: 'Main Server has not been executed.',
              postExecutionSuccessText: 'Main Server has been executed.',
              postExecutionFailureText: 'Main Server has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'c291d6f2-22cc-4823-8521-0c286a4b746e',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '2fd99f78-e565-444c-a067-e63085931e56',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '29315099-c434-46e5-bd0e-ccaefc63a0a8',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '7504c4fa-f470-47a5-93eb-819bb3e3227e',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'da103e1d-8114-43a2-8e43-0c83cc422e32',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'a1ac306f-7af6-49d1-957f-c80fca30954d',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 4,
              mapY: -4,
            },
            {
              nodeID: '10',
              name: 'Main Server',
              color: 'green',
              preExecutionText: 'Main Server has not been executed.',
              postExecutionSuccessText: 'Main Server has been executed.',
              postExecutionFailureText: 'Main Server has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'b8a9849e-f29c-4ded-ba24-f22400c25ba7',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '9d16c084-f009-4ff5-8be7-4509198546b8',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '28e75888-2b89-4115-8320-1077775fc93f',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '0017c7fb-d220-4d31-9967-9e8420eee0d5',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'eb1a161a-ed1e-4ec1-baf2-c7654b6f7703',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '3770c909-ac41-4712-ac6f-074c82f6500d',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 4,
              mapY: -3,
            },
            {
              nodeID: '13',
              name: 'Main Server',
              color: 'green',
              preExecutionText: 'Main Server has not been executed.',
              postExecutionSuccessText: 'Main Server has been executed.',
              postExecutionFailureText: 'Main Server has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'b836ce3e-118d-4611-9f06-baa9cd2490a4',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '40bba0a6-bd49-431f-8f28-be9f8392c652',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'df5e3af6-c216-4734-9506-adfc0626f4b0',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'e9696493-3a45-4742-b320-dcc8698e88b3',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '0dc8a928-baf1-4158-b777-bc2a4f0ab261',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'a77f7b0b-3851-479e-9256-c2d9fd11e4d2',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 4,
              mapY: -2,
            },
            {
              nodeID: '14',
              name: 'Air Defense',
              color: 'pink',
              preExecutionText: '',
              postExecutionSuccessText: '',
              postExecutionFailureText: '',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'e58f3888-29cb-46ec-a7c2-59df43e6c55a',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'b2db5530-9154-4676-a590-db95678dd2ac',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '6721a0b4-9f3b-4732-9d28-087e1439be1e',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'e0c60aae-e25c-46c4-8a77-caa6cc710671',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'c7ba4065-249e-4ae0-996d-ae4392861c62',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '4e2ca073-8ec9-43fd-9c57-6c73a90b54da',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 0,
              mapY: -1,
            },
            {
              nodeID: '15',
              name: 'IADS Network',
              color: 'pink',
              preExecutionText: 'IADS Network has not been executed.',
              postExecutionSuccessText: 'IADS Network has been executed.',
              postExecutionFailureText: 'IADS Network has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '0937da57-a9cc-44bf-9400-5a94b808a4f1',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '45fa771e-8e4e-4bf7-ad0b-15354a8199ea',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'ad6079a3-ebd3-45e9-9d25-ee327a400e0d',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'e4a53923-2e82-49d9-8416-9e8b2a11e697',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'e827681d-0b04-43a4-aca6-c117cbd4104c',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'aedf829d-0f90-4575-90b2-013168c12185',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: -1,
            },
            {
              nodeID: '16',
              name: 'Individual IADS Sites',
              color: 'pink',
              preExecutionText: 'Individual IADS Sites has not been executed.',
              postExecutionSuccessText:
                'Individual IADS Sites has been executed.',
              postExecutionFailureText:
                'Individual IADS Sites has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'cdc56bbb-67f0-46eb-9d08-3cb81d96c72d',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'aad2fe1a-beca-48bc-b5a0-d2b77c91c38d',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '61eba72a-e1c6-4138-a2ab-b3fae462d640',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '1cf83ff1-82dd-448c-a57b-e24f57fdbdee',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '85ac433e-fb97-4a02-90c6-680b05a782ab',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'c0210adc-eeea-4859-a4dc-8a41c9247e2b',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: -1,
            },
            {
              nodeID: '17',
              name: 'Launchers',
              color: 'pink',
              preExecutionText: 'Launchers has not been executed.',
              postExecutionSuccessText: 'Launchers has been executed.',
              postExecutionFailureText: 'Launchers has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '85e94f87-04d4-4cde-90f0-94d144ed456a',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'e7508758-1273-4fcd-8f2d-cdc39e835ccf',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '09b3ed40-2fbf-40af-b05c-3eca88eab910',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '68b75a90-1137-4f5b-a08e-c4067de0d7db',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '44e782d3-0318-41f5-a923-14b791316c2a',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'd5b0cd95-34e5-493e-81c2-644bc3063283',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 3,
              mapY: -1,
            },
            {
              nodeID: '18',
              name: 'Radars',
              color: 'pink',
              preExecutionText: 'Radars has not been executed.',
              postExecutionSuccessText: 'Radars has been executed.',
              postExecutionFailureText: 'Radars has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '98600cf1-49f8-4fdc-9326-631da7eb05c9',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'dafcc2dd-f33c-4680-ad72-b67f240aea93',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'dffad904-f645-45d1-b632-e632bc9ab1d9',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '9b6e00e1-f0dd-44c2-86db-f71fc3bc8b70',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '2421accd-2c15-4269-961f-745b7d4e1b5a',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'df589956-f882-4375-86f8-fd43bc54ae4c',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 3,
              mapY: 0,
            },
            {
              nodeID: '19',
              name: 'Infrastructure',
              color: 'yellow',
              preExecutionText: '',
              postExecutionSuccessText: '',
              postExecutionFailureText: '',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'f68c697d-843e-413e-8b6a-3433fd8c378d',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'c943801c-dd3b-48b3-ae6b-c267ed72d161',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '2665c987-ee4b-459d-9b25-714eb6e40693',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '50b23b23-d1ce-466b-8134-e7a752b59eac',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'a2dbf3af-fed4-4199-b9a6-9f719ae4c931',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'e90eaa14-ff0b-48c0-9064-db7ab6867a38',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 0,
              mapY: 1,
            },
            {
              nodeID: '20',
              name: 'Railroad System',
              color: 'yellow',
              preExecutionText: 'Railroad System has not been executed.',
              postExecutionSuccessText: 'Railroad System has been executed.',
              postExecutionFailureText:
                'Railroad System has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'e4b25d60-e6bd-4a26-a011-cff02beee372',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '1a1505d8-b28d-4dcd-bdf0-dfeab8c43f15',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '4d718382-6f40-4f6e-af1d-aff45b4533fc',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'd0e4e786-4dcf-4bb9-aa92-efa1b31f5197',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '81a626b7-e722-40ca-ad3c-add01eb9db54',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '9964ba90-ee92-4df6-8d71-3ee3efa868be',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 0,
            },
            {
              nodeID: '23',
              name: 'Electrical System',
              color: 'yellow',
              preExecutionText: 'Electrical System has not been executed.',
              postExecutionSuccessText: 'Electrical System has been executed.',
              postExecutionFailureText:
                'Electrical System has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'f4b62c8e-4912-4667-8fa7-b60308fa2566',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'c1001d37-51d2-41b8-832b-dc689bd2c2c2',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '6e34b2fd-997b-450a-8fc0-b54b48d56fce',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '5cab7389-6f14-481d-b17e-e0844cba9cf2',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '283baf96-5d2b-4365-a508-b553682c4bcb',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'c4149c3d-b2fe-4353-9e35-80148ecbc3f4',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 1,
            },
            {
              nodeID: '25',
              name: 'Water System',
              color: 'yellow',
              preExecutionText: 'Water System has not been executed.',
              postExecutionSuccessText: 'Water System has been executed.',
              postExecutionFailureText: 'Water System has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '3d985448-19b0-46f0-bd35-1acc7f1de99f',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '28408bb2-03f3-47f2-82c9-b0d3161fd65f',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '0fc78a78-1b08-4cd3-918e-a7e8c69bae5b',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '76f32274-3ed0-4eb6-9051-2fc5df254f0e',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '364158c9-ff99-4b49-8496-f4018c3e7ffe',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '5364b949-5d56-4e1a-bf28-324a011af9a1',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 2,
            },
            {
              nodeID: '27',
              name: 'Road System',
              color: 'yellow',
              preExecutionText: 'Road System has not been executed.',
              postExecutionSuccessText: 'Road System has been executed.',
              postExecutionFailureText: 'Road System has failed to execute.',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: '4e1339e3-6d29-4103-a46f-8c3b9a0357be',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '8cce60de-92c0-4cb4-8049-193795e0abe6',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'ac42c84d-cbde-4aac-9345-8838aea05c49',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'ac1c083a-4b7c-4e4d-bb96-b65f2ac5c5a2',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'dff65b2c-bc4e-4df2-bb4a-0ea5c78cd697',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '8477a484-a524-49ab-883d-0db6b466083b',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 3,
            },
            {
              nodeID: '21',
              name: 'Track Monitoring',
              color: 'yellow',
              preExecutionText: 'Track Monitoring has not been executed.',
              postExecutionSuccessText: 'Track Monitoring has been executed.',
              postExecutionFailureText:
                'Track Monitoring has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'b6907e7e-abae-4d86-bbad-171c8a2b5aca',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'e85171ce-f245-4852-8c8c-36e68b251c6b',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '92950d99-3a37-4268-8f25-64eceadb7147',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '517bd4dc-5383-4246-91be-fc7f4f618c93',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'd99c9704-5a73-45a5-b730-feafb76a8fbd',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '79058129-efc7-4b2e-825a-f00a7a821783',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 0,
            },
            {
              nodeID: '22',
              name: 'Track Switch System',
              color: 'yellow',
              preExecutionText: 'Track Switch System has not been executed.',
              postExecutionSuccessText:
                'Track Switch System has been executed.',
              postExecutionFailureText:
                'Track Switch System has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'a01c7a96-ec72-481b-b248-e64895878c86',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '931ce29b-9661-4a59-b4fb-14aa23bc722a',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '90c336be-043a-48f2-8a8a-e2f1027498ae',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'eefe8f4f-3475-4be6-8d3e-2f21f979ed78',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '6ebaf660-badf-408d-a88f-3fd625515048',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '043c2bf6-389b-4b22-8f6d-f6d477143ee9',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 1,
            },
            {
              nodeID: '24',
              name: 'Regional Service',
              color: 'yellow',
              preExecutionText: 'Regional Service has not been executed.',
              postExecutionSuccessText: 'Regional Service has been executed.',
              postExecutionFailureText:
                'Regional Service has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '85be76e1-8057-4b8c-9c9f-53ce516351a6',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '3d71ea78-54c9-4f4d-9124-c45142e5852b',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '405de4f9-7bac-4a43-8a0b-db9c6629ec5c',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'b74a443f-9dc6-4bd3-9f4b-db8c488c1a85',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '07ec5e60-a6df-4b13-ae34-c5b8044fef1e',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '3f8bafc3-cccb-418e-875b-83f7245dad0a',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 2,
            },
            {
              nodeID: '26',
              name: 'Valve System',
              color: 'yellow',
              preExecutionText: 'Valve System has not been executed.',
              postExecutionSuccessText: 'Valve System has been executed.',
              postExecutionFailureText: 'Valve System has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '1796d607-911e-4dbb-bc60-916b961082a8',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '46a4ff39-920d-4d46-9f0f-7204cfcb450b',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'e5f3effb-3f10-4e53-801a-09548c44de2e',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '129ce2ef-de75-440c-8631-2ad5b237f20e',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '08c13970-f96d-4149-9507-47d15c780807',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'ec026859-a5ca-464c-9be2-9ccab8c1c5cc',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 3,
            },
            {
              nodeID: '28',
              name: 'Traffic Light System',
              color: 'yellow',
              preExecutionText: 'Traffic Light System has not been executed.',
              postExecutionSuccessText:
                'Traffic Light System has been executed.',
              postExecutionFailureText:
                'Traffic Light System has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '2e7da483-078e-4a96-be26-6b8dfeed8770',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '832cbf4d-d476-4dcb-a2b7-658856453bc4',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '2377523e-9d83-48fa-a31c-2f436b73995f',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'a44a895d-ecda-4ecc-9956-7d00e6cd36e2',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '13d7fd1a-121a-429d-bd81-250451181e9b',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '06f45ba6-4da8-4a01-a5e8-20bb71de1ef9',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 4,
            },
            {
              nodeID: '29',
              name: 'CCTV System',
              color: 'yellow',
              preExecutionText: 'CCTV System has not been executed.',
              postExecutionSuccessText: 'CCTV System has been executed.',
              postExecutionFailureText: 'CCTV System has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'ca750e80-b3af-4895-9857-458897defd9f',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'd8865520-f9df-425e-bb30-be75e1f7c8cf',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'c612c450-5d7e-40f4-9c12-e495b53dbeec',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'a1ca19d9-407e-4cc8-989b-ec21fb2f0d91',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'f5798e1a-8f03-458b-8777-c8b3c3dcced1',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '7a688b05-acdb-4b12-a9e5-4a355b21ac83',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 2,
              mapY: 5,
            },
            {
              nodeID: '30',
              name: 'Satellite Services',
              color: 'blue',
              preExecutionText: '',
              postExecutionSuccessText: '',
              postExecutionFailureText: '',
              actionData: 'exec command',
              executable: false,
              actions: [
                {
                  actionID: 'f9da3f12-4714-4c0e-b477-819a582da2fe',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'b6dd70f0-279f-427b-8e7c-0999d624e8fd',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '9a008ef3-db94-4109-ad99-c276cc85e055',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '66409265-ee27-4abe-b273-676b741dd8ca',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '7343b3f4-6e84-4542-87da-74a9f702c448',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '1e85bac9-9870-4669-b046-c62b8c89d010',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 0,
              mapY: 4,
            },
            {
              nodeID: '31',
              name: 'Global Positioning',
              color: 'blue',
              preExecutionText: 'Global Positioning has not been executed.',
              postExecutionSuccessText: 'Global Positioning has been executed.',
              postExecutionFailureText:
                'Global Positioning has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '7fdf5682-9c40-47bb-86ca-4f6d60979b81',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '516a9f09-9ab9-45a8-b25d-53bc466f5f93',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'd4163294-cc15-4d5f-8dbb-d515823e9fea',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: 'c5bd02cf-8667-43a4-84ca-6dfca1edc58f',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '7eaf24a5-d775-4e8b-a376-6689068dc9c1',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'a994ff3c-5581-4fb0-a028-20357cfe4b37',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 4,
            },
            {
              nodeID: '32',
              name: 'Data Transfer',
              color: 'blue',
              preExecutionText: 'Data Transfer has not been executed.',
              postExecutionSuccessText: 'Data Transfer has been executed.',
              postExecutionFailureText: 'Data Transfer has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: '2cc0d495-39c8-44c0-aea0-0ac8c24579d4',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '6f61a93e-b027-454c-abe9-b713ecf59a35',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: '38da1404-e7af-490a-94b7-33e815f359f0',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '9c6dccfe-d5a2-42f4-a7aa-d902a654350b',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: '21bcc29a-e6ff-483b-8520-d6ded6a7f068',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'be55613a-6087-4d01-91a6-dc91c0722f49',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 5,
            },
            {
              nodeID: '33',
              name: 'Imagery Collection',
              color: 'blue',
              preExecutionText: 'Imagery Collection has not been executed.',
              postExecutionSuccessText: 'Imagery Collection has been executed.',
              postExecutionFailureText:
                'Imagery Collection has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'f02cdc12-ebe9-497c-9861-226ed6a90b8c',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: '0ca0520b-be81-4e60-a23f-15fb680fcaf0',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'e04d14f3-23fa-4be1-9161-08b5f56d58cc',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '0bca525e-849b-42f2-b384-d02dd8bd76ac',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'cacf4cdf-d46b-4dd7-881e-2d9d25f10cd2',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: 'e23339b4-dc51-42cc-9856-67ac66a1cce8',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 6,
            },
            {
              nodeID: '34',
              name: 'Sensor Observation',
              color: 'blue',
              preExecutionText: 'Sensor Observation has not been executed.',
              postExecutionSuccessText: 'Sensor Observation has been executed.',
              postExecutionFailureText:
                'Sensor Observation has failed to execute.',
              actionData: 'exec command',
              executable: true,
              actions: [
                {
                  actionID: 'bed7323c-6fdb-46f9-89b1-d1e4f6146065',
                  name: 'Deny',
                  processTime: 1000,
                  successChance: 0.5,
                },
                {
                  actionID: 'ff336f82-48d7-4f5e-924f-359b00e9f24f',
                  name: 'Degrade',
                  processTime: 2000,
                  successChance: 0.6,
                },
                {
                  actionID: 'f3e8f4db-ef34-4619-bb75-a862182b88cb',
                  name: 'Destroy',
                  processTime: 3000,
                  successChance: 0.6,
                },
                {
                  actionID: '2bcd1458-1846-4e1e-80b2-1a2a4ec84803',
                  name: 'Disrupt',
                  processTime: 4000,
                  successChance: 0.7,
                },
                {
                  actionID: 'fdf6a1c4-e2de-4058-9f9a-925eaee261aa',
                  name: 'Manipulate',
                  processTime: 5000,
                  successChance: 0.8,
                },
                {
                  actionID: '23417a3f-04db-4398-81c3-9a86d4660756',
                  name: 'Extract',
                  processTime: 6000,
                  successChance: 0.8,
                },
              ],
              mapX: 1,
              mapY: 7,
            },
          ],
        }

        missionModel.create(
          incredibleMissionData,
          (error: Error, incredibleMission: any) => {
            if (error) {
              console.error('Failed to create "Incredible Mission":')
              console.error(error)
            } else {
              console.log(
                '"Incredible Mission" created:',
                incredibleMission.name,
              )
            }
          },
        )
      }
    })
}

// This will initialize the database for
// use.
export function initialize() {
  mongoose.connect(MONGO_HOST)

  connection = mongoose.connection

  // database error handling
  connection.on(
    'error',
    console.error.bind(console, 'Failed connection to database: '),
  )

  // logs when server succesfully connects to database
  connection.once('open', () => {
    console.log('Connected to database.')
    ensureDefaultDataExists()
  })
}

// This will return the global connection
// variable that is set in initialize.
export function getConnection(): mongoose.Connection | null {
  return connection
}

export default {
  initialize,
  getConnection,
}
