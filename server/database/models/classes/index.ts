import { DefaultSchemaOptions, Schema } from 'mongoose'
import {
  TFileReference,
  TFileReferenceDoc,
  TFileReferenceMethods,
  TFileReferenceModel,
  TFileReferenceStaticMethods,
  TFileReferenceVirtuals,
  TInfo,
  TInfoMethods,
  TInfoModel,
  TMission,
  TMissionDoc,
  TMissionMethods,
  TMissionModel,
  TMissionStaticMethods,
  TMissionVirtuals,
  TUser,
  TUserDoc,
  TUserMethods,
  TUserModel,
  TUserStaticMethods,
  TUserVirtuals,
} from '../types'

/**
 * Represents a mongoose schema for a mission in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export class MissionSchema extends Schema<
  TMission,
  TMissionModel,
  TMissionMethods,
  {},
  TMissionVirtuals,
  TMissionStaticMethods,
  DefaultSchemaOptions,
  TMissionDoc
> {}

/**
 * Represents a mongoose schema for a user in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export class UserSchema extends Schema<
  TUser,
  TUserModel,
  TUserMethods,
  {},
  TUserVirtuals,
  TUserStaticMethods,
  DefaultSchemaOptions,
  TUserDoc
> {}

/**
 * Represents a mongoose schema for info in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export class InfoSchema extends Schema<TInfo, TInfoModel, TInfoMethods> {}

/**
 * Represents a mongoose schema for a file reference in the database.
 * @see https://mongoosejs.com/docs/typescript/schemas.html#generic-parameters
 */
export class FileReferenceSchema extends Schema<
  TFileReference,
  TFileReferenceModel,
  TFileReferenceMethods,
  {},
  TFileReferenceVirtuals,
  TFileReferenceStaticMethods,
  DefaultSchemaOptions,
  TFileReferenceDoc
> {}
