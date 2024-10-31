import mongoose from 'mongoose'
import { TCommonMissionJson } from '../../shared/missions'
import { TCommonUserJson } from '../../shared/users'
import UserAccess from '../../shared/users/accesses'

let ObjectId = mongoose.Types.ObjectId

export const userCredentials = {
  username: 'admin',
  password: 'temppass',
}

export const createMissionWithNoForceData: Omit<TCommonMissionJson, 'forces'> =
  {
    name: 'No Node Data Mission (To Delete)',
    versionNumber: 1,
    seed: new ObjectId().toString(),
    structure: {
      '4767fab5-573e-4df3-b1cd-809240804e92': {},
    },
    prototypes: [
      {
        _id: '41aea0c0-65f5-4008-a623-1ce41cb3008f',
        structureKey: '4767fab5-573e-4df3-b1cd-809240804e92',
        depthPadding: 0,
      },
    ],
  }

export const testMission: TCommonMissionJson = {
  name: 'Test Mission (To Delete)',
  versionNumber: 1,
  seed: new ObjectId().toString(),
  structure: {
    '4767fab5-573e-4df3-b1cd-809240804e92': {},
  },
  forces: [
    {
      _id: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
      introMessage: '<p>Welcome to your force!</p>',
      name: 'Test Force',
      color: '#52b1ff',
      initialResources: 100,
      nodes: [
        {
          _id: '211e5104-1c9d-487c-92b8-0a296f758d90',
          prototypeId: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
          name: 'Test Node',
          color: '#52b1ff',
          description: '',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: '4dc75939-fd76-4db6-9870-bacc47526752',
              name: 'New Action',
              description: '',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your unsuccessful post-execution message here.</p>',
              effects: [
                {
                  _id: '0c6eb646-061b-4598-b748-e54e49d1cba6',
                  name: 'New Effect',
                  description: '',
                  targetEnvironmentVersion: '0.1',
                  targetId: 'output',
                  args: {
                    forceMetaData: {
                      forceId: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
                      forceName: 'Test Force',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  prototypes: [
    {
      _id: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
      structureKey: '4767fab5-573e-4df3-b1cd-809240804e92',
      depthPadding: 0,
    },
  ],
}

export const updateMissionWithNoMissionId: TCommonMissionJson = {
  name: 'Updated No Node Data (To Delete)',
  versionNumber: 1,
  seed: new ObjectId().toString(),
  structure: {
    '4767fab5-573e-4df3-b1cd-809240804e92': {},
  },
  forces: [
    {
      _id: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
      introMessage: '<p>Welcome to your force!</p>',
      name: 'Test Force',
      color: '#52b1ff',
      initialResources: 100,
      nodes: [
        {
          _id: '211e5104-1c9d-487c-92b8-0a296f758d90',
          prototypeId: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
          name: 'Test Node',
          color: '#52b1ff',
          description: '',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: '4dc75939-fd76-4db6-9870-bacc47526752',
              name: 'New Action',
              description: '',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your unsuccessful post-execution message here.</p>',
              effects: [
                {
                  _id: '0c6eb646-061b-4598-b748-e54e49d1cba6',
                  name: 'New Effect',
                  description: '',
                  targetEnvironmentVersion: '0.1',
                  targetId: 'output',
                  args: {
                    forceMetaData: {
                      forceId: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
                      forceName: 'Test Force',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  prototypes: [
    {
      _id: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
      structureKey: '4767fab5-573e-4df3-b1cd-809240804e92',
      depthPadding: 0,
    },
  ],
}

export const updateMissionWithNoNodeStructure: Omit<
  TCommonMissionJson,
  'structure'
> = {
  name: 'Update No Node Structure (To Delete)',
  versionNumber: 1,
  seed: new ObjectId().toString(),
  forces: [
    {
      _id: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
      introMessage: '<p>Welcome to your force!</p>',
      name: 'Test Force',
      color: '#52b1ff',
      initialResources: 100,
      nodes: [
        {
          _id: '211e5104-1c9d-487c-92b8-0a296f758d90',
          prototypeId: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
          name: 'Test Node',
          color: '#52b1ff',
          description: '',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: '4dc75939-fd76-4db6-9870-bacc47526752',
              name: 'New Action',
              description: '',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your unsuccessful post-execution message here.</p>',
              effects: [
                {
                  _id: '0c6eb646-061b-4598-b748-e54e49d1cba6',
                  name: 'New Effect',
                  description: '',
                  targetEnvironmentVersion: '0.1',
                  targetId: 'output',
                  args: {
                    forceMetaData: {
                      forceId: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
                      forceName: 'Test Force',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  prototypes: [
    {
      _id: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
      structureKey: '4767fab5-573e-4df3-b1cd-809240804e92',
      depthPadding: 0,
    },
  ],
}

export const updateMissionWithNoForceData: Omit<TCommonMissionJson, 'forces'> =
  {
    name: 'No Node Data Mission (To Delete)',
    versionNumber: 1,
    seed: new ObjectId().toString(),
    structure: {
      'e72aa13b-3d99-406a-a435-b0f5f2e31873': {},
    },
    prototypes: [
      {
        _id: 'b7cdf371-9dad-4d98-9b93-c83b060c121a',
        structureKey: 'e72aa13b-3d99-406a-a435-b0f5f2e31873',
        depthPadding: 0,
      },
    ],
  }

export const correctUpdateTestMission: TCommonMissionJson = {
  name: 'Updated Test Mission (To Delete)',
  versionNumber: 1,
  seed: new ObjectId().toString(),
  structure: {
    '4767fab5-573e-4df3-b1cd-809240804e92': {},
  },
  forces: [
    {
      _id: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
      introMessage: '<p>Welcome to your force!</p>',
      name: 'Test Force',
      color: '#52b1ff',
      initialResources: 100,
      nodes: [
        {
          _id: '211e5104-1c9d-487c-92b8-0a296f758d90',
          prototypeId: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
          name: 'Test Node',
          color: '#52b1ff',
          description: '',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: '4dc75939-fd76-4db6-9870-bacc47526752',
              name: 'New Action',
              description: '',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your unsuccessful post-execution message here.</p>',
              effects: [
                {
                  _id: '0c6eb646-061b-4598-b748-e54e49d1cba6',
                  name: 'New Effect',
                  description: '',
                  targetEnvironmentVersion: '0.1',
                  targetId: 'output',
                  args: {
                    forceMetaData: {
                      forceId: 'def3d81c-e8fd-470b-afb3-ba0a293bae73',
                      forceName: 'Test Force',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  prototypes: [
    {
      _id: '0d709d54-2f5e-44e3-b8ce-91534ce02f6f',
      structureKey: '4767fab5-573e-4df3-b1cd-809240804e92',
      depthPadding: 0,
    },
  ],
}

export const correctUser: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test23',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
    password: 'password',
  },
}

export let newCorrectUser: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test24',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
    password: 'password',
  },
}

export const userWithNoPassword: { user: TCommonUserJson } = {
  user: {
    _id: new mongoose.Types.ObjectId().toHexString(),
    username: 'test23',
    accessId: UserAccess.AVAILABLE_ACCESSES.student._id,
    expressPermissionIds: [],
    firstName: 'Test',
    lastName: 'User',
    needsPasswordReset: false,
  },
}
