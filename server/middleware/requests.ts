import { BooleanToolbox } from '@shared/toolbox/booleans/BooleanToolbox'
import type { TAnyObject } from '@shared/toolbox/objects/ObjectToolbox'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'
import type {
  TExistingUserPreferencesJson,
  TUserPreferencesJson,
} from '@shared/users/User'
import { User } from '@shared/users/User'
import type { TUserAccess } from '@shared/users/UserAccess'
import { UserAccess } from '@shared/users/UserAccess'
import type { NextFunction, Request, Response } from 'express-serve-static-core'
import { isObjectIdOrHexString } from 'mongoose'
import { z as zod } from 'zod'
import type { TZodify } from '../connect/middleware/validate'

// ------- ENUMERATIONS ------- //

// These are the types that can be
// passed in the request body to the
// API.
export class RequestBodyFilters {
  /**
   * This filters a string included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string') {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string literal included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_LITERAL<TOptions extends string>(options: TOptions[]) {
    return (bodyKey: string, bodyValue: any): Error | null => {
      if (
        typeof bodyValue !== 'string' ||
        !options.includes(bodyValue as TOptions)
      ) {
        throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
      } else {
        return null
      }
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 50 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_50_CHAR(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 50) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 128 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_128_CHAR(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 128) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 255 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_255_CHAR(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 255) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 256 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_256_CHAR(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 256) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 512 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_512_CHAR(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 512) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 1024 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_1024_CHAR(
    bodyKey: string,
    bodyValue: any,
  ): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 1024) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 16,777,215 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static STRING_MEDIUMTEXT(
    bodyKey: string,
    bodyValue: any,
  ): Error | null {
    if (typeof bodyValue !== 'string' || bodyValue.length > 16777215) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a number included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static NUMBER(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'number' || isNaN(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a boolean included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static BOOLEAN(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue === 'number' || typeof bodyValue === 'boolean') {
      let valueAsStr: string = bodyValue.toString()

      if (!BooleanToolbox.isValid(valueAsStr)) {
        throw new Error(
          invalidRequestBodyPropertyException(bodyKey, valueAsStr),
        )
      } else {
        return null
      }
    } else if (typeof bodyValue === 'string') {
      if (!BooleanToolbox.isValid(bodyValue)) {
        throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
      } else {
        return null
      }
    } else {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  /**
   * This filters an object included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static OBJECT(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'object' || Array.isArray(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters an objectId included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static OBJECTID(bodyKey: string, bodyValue: any): Error | null {
    if (!isObjectIdOrHexString(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters an array included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  public static ARRAY(bodyKey: string, bodyValue: any): Error | null {
    if (!Array.isArray(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a username included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @throws An error message or null
   */
  public static USERNAME(bodyKey: string, bodyValue: any) {
    let usernameIsValid: boolean = User.isValidUsername(bodyValue)

    if (typeof bodyValue !== 'string' || !usernameIsValid) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  /**
   * This filters a password included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @throws An error message or null
   */
  public static PASSWORD(bodyKey: string, bodyValue: any) {
    let passwordIsValid: boolean = User.isValidPassword(bodyValue)

    if (typeof bodyValue !== 'string' || !passwordIsValid) {
      throw new Error(
        invalidRequestBodyPropertyException(bodyKey, bodyValue, true),
      )
    }
  }

  /**
   * This filters a name included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @throws An error message or null
   */
  public static NAME(bodyKey: string, bodyValue: any) {
    let nameIsValid: boolean = User.isValidName(bodyValue)

    if (typeof bodyValue !== 'string' || !nameIsValid) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  /**
   * This filters an access included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @throws An error message or null
   */
  public static ACCESS(bodyKey: string, bodyValue: TUserAccess['_id']) {
    if (!UserAccess.isValidAccessId(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  /**
   * This filters a version included in a request body, ensuring
   * it matches the expected *.*.* format.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   */
  public static VERSION(bodyKey: string, bodyValue: any) {
    if (!VersionToolbox.isValidVersion(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  /**
   * This filters user preferences included in a request body. Ensuring
   * the preferences match the expected structure.
   * @param existing If true, the preferences as well as all nested objects
   * must have an _id.
   * @throws An error message or null
   */
  public static USER_PREFERENCES =
    (existing: boolean) => (bodyKey: string, bodyValue: any) => {
      const preferencesSchema: TZodify<TUserPreferencesJson> = zod
        .object({
          _id: zod.string().optional(),
          missionMap: zod.object({
            _id: zod.string().optional(),
            panOnDefectSelection: zod.boolean(),
          }),
        })
        .strict()
      const existingPreferencesSchema: TZodify<TExistingUserPreferencesJson> =
        zod
          .object({
            _id: zod.string(),
            missionMap: zod.object({
              _id: zod.string(),
              panOnDefectSelection: zod.boolean(),
            }),
          })
          .strict()

      const validationResult = existing
        ? existingPreferencesSchema.safeParse(bodyValue)
        : preferencesSchema.safeParse(bodyValue)

      if (!validationResult.success) {
        throw new Error(
          invalidRequestBodyPropertyException(bodyKey, bodyValue, true),
        )
      }
    }
}

// ------- INTERNAL FUNCTIONS ------- //

/**
 * This function is used to create an error message
 * when a property in the request body of a post
 * request is invalid.
 * @param key The key that was passed in the request body.
 * @param value The value that was passed in the request body.
 * @param hasSensitiveContent If the data contains sensitive content.
 * @returns An error message.
 */
const invalidRequestBodyPropertyException = (
  key: string,
  value: any,
  hasSensitiveContent: boolean = false,
): string => {
  if (hasSensitiveContent) {
    return `Bad Request_The-property-"${key}"-in-the-request-body-has-an-invalid-value`
  }

  return `Bad Request_{"${key}": "${value}"}-is-invalid`
}

/**
 * Validates the type of keys that are passed in
 * the request query
 * @param query The query in the request
 * @param key The key in the query
 * @param type The type of the property
 * @returns An error message or null
 */
const validateTypeOfQueryKey = (
  query: TAnyObject,
  key: string,
  type: TQueryValue,
): null | Error => {
  let errorMessage: string = `Bad Request_query-key-type-required="${type}"_query-key-type-sent="${query[key]}"`

  // If the property's type from the query in the request is a
  // string then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'string') {
    if (query[key] !== `${query[key]}`) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the query in the request is a
  // number then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'number') {
    if (isNaN(parseFloat(query[key]))) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the query in the request is an
  // integer then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'integer') {
    if (
      isNaN(parseInt(query[key])) ||
      parseInt(query[key]) !== parseFloat(query[key])
    ) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the query in the request is a
  // boolean then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'boolean') {
    if (!BooleanToolbox.isValid(query[key])) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the query in the request is an
  // objectId then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'objectId') {
    let isObjectId: boolean = isObjectIdOrHexString(query[key])
    if (!isObjectId) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  } else {
    throw new Error('Bad Request_Invalid-Type-For-Query-Key')
  }
}

/**
 * Validates the type of keys that are passed in
 * the request params
 * @param params The params in the request
 * @param key The key in the params
 * @param type The type of the property
 * @returns An error message or null
 */
const validateTypeOfParamsKey = (
  params: TAnyObject,
  key: string,
  type: TParamValue,
): null | Error => {
  let errorMessage: string = `Bad Request_params-key-type-required="${type}"_params-key-type-sent="${params[key]}"`

  // If the property's type from the params in the request is a
  // string then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'string') {
    if (params[key] !== `${params[key]}`) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the params in the request is a
  // number then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'number') {
    if (isNaN(parseFloat(params[key]))) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  }

  // If the property's type from the params in the request is an
  // objectId then this validates to make sure the property being
  // sent via the API route is the right type
  else if (type === 'objectId') {
    let isObjectId: boolean = isObjectIdOrHexString(params[key])
    if (!isObjectId) {
      throw new Error(errorMessage)
    } else {
      return null
    }
  } else {
    throw new Error('Bad Request_Invalid-Type-For-Params-Key')
  }
}

/**
 * This function is used to validate the body of a request
 * based on the schema structure.
 * It will check to see if the specified key's value(s) sent
 * in the body of the current request are the correct type.
 * If all the keys and their values are the correct type,
 * then a sanitized object is returned with the correct
 * keys and their values (extra data that is not
 * specifically defined will be removed). However, if any
 * of the key's values are the incorrect type, then an
 * error is thrown.
 * @param body The body of the request
 * @param requiredBodyKeys The required keys and their types
 * @param optionalBodyKeys The optional keys and their types
 * @param recursiveParentKey (***DO NOT INCLUDE - RECURSIVE PURPOSES ONLY***) The parent key of a nested key
 * @param sanitizedObject (***DO NOT INCLUDE - RECURSIVE PURPOSES ONLY***) The sanitized object
 * @returns A sanitized object with the correct keys and their values or an error
 */
const validateBodyKeys = (
  body: TAnyObject,
  requiredBodyKeys: {},
  optionalBodyKeys: {},
  recursiveParentKey?: string,
  sanitizedObject: TAnyObject = {},
): TAnyObject | Error => {
  // This loop checks to see if the required keys
  // are in the request body of the current express
  // request and if the required keys are the correct
  // type. There is a possibility of nested objects
  // in the request body, so this function is recursive.
  for (let [requiredKey, requiredValue] of Object.entries(requiredBodyKeys)) {
    // This is the value of the current key in the
    // request body
    let bodyValue: any = body[requiredKey]

    // If the current required key is not in the request
    // body then an error is thrown
    if (!(requiredKey in body)) {
      throw new Error(
        recursiveParentKey
          ? `Bad_Request_"${recursiveParentKey}.${requiredKey}"-is-missing-in-the-body-of-the-request`
          : `Bad_Request_"${requiredKey}"-is-missing-in-the-body-of-the-request`,
      )
    }

    // If the current required key is in the request body
    // and the required value is a function, then the validator
    // function is called to validate the type of the
    // current key in the request body
    if (typeof requiredValue === 'function') {
      let validation: Error | null = requiredValue(requiredKey, bodyValue)

      // If null is returned by the validator function then
      // the value of the current key in the request body
      // is the correct type and is added to the sanitized
      // object
      if (validation === null || validation === undefined) {
        sanitizedObject[requiredKey] = bodyValue
      } else {
        throw validation
      }
    }
    // If the current required key is in the request body
    // and the value is an object, then the validateBodyKeys
    // function is called recursively to validate the
    // nested object
    else if (typeof requiredValue === 'object') {
      // Build next recursive parent key.
      let nextRecursiveParentKey: string =
        recursiveParentKey === undefined
          ? requiredKey
          : `${recursiveParentKey}.${requiredKey}`

      sanitizedObject[requiredKey] = validateBodyKeys(
        bodyValue,
        requiredValue as TAnyObject,
        {},
        nextRecursiveParentKey,
      )
    }
  }

  // This loop checks to see if the optional keys
  // are in the request body of the current express
  // request and if the optional keys are the correct
  // type. There is a possibility of nested objects
  // in the request body, so this function is recursive.
  for (let [optionalKey, optionalValue] of Object.entries(optionalBodyKeys)) {
    if (optionalKey in body) {
      // This is the value of the current key in the
      // request body
      let bodyValue: any = body[optionalKey]

      // If the current optional key is in the request body
      // and the optional value is a function, then the validator
      // function is called to validate the type of the
      // current key in the request body
      if (typeof optionalValue === 'function') {
        let validation: Error | null = optionalValue(optionalKey, bodyValue)

        // If null is returned by the validator function then
        // the value of the current key in the request body
        // is the correct type and is added to the sanitized
        // object
        if (validation === null || validation === undefined) {
          sanitizedObject[optionalKey] = bodyValue
        } else {
          throw validation
        }
      }
      // If the current optional key is in the request body
      // and the value is an object, then the validateBodyKeys
      // function is called recursively to validate the
      // nested object
      else if (typeof optionalValue === 'object') {
        // The sanitized object is passed as a parameter
        // here so that the required keys that have already
        // been validated remain in the sanitized object.
        // Otherwise the required keys would be removed
        // from the sanitized object.
        sanitizedObject[optionalKey] = validateBodyKeys(
          bodyValue,
          {},
          optionalValue as TAnyObject,
          undefined,
          sanitizedObject[optionalKey],
        )
      }
    }
  }

  return sanitizedObject
}

/**
 * This function is used to validate the query of a request
 * based on the schema structure.
 * It will check to see if the specified key's value(s) sent
 * in the query of the current request are the correct type.
 * If all the keys and their values are the correct type,
 * then a sanitized object is returned with the correct
 * keys and their values (extra data that is not
 * specifically defined will be removed). However, if any
 * of the key's values are the incorrect type, then an
 * error is thrown.
 * @param query The query of the request
 * @param requiredQueryKeys The required keys and their types
 * @param optionalQueryKeys The optional keys and their types
 * @returns A sanitized object with the correct keys and their values or an error
 */
const validateQueryKeys = (
  query: TAnyObject,
  requiredQueryKeys: {},
  optionalQueryKeys?: {},
): TAnyObject | Error => {
  let sanitizedObject: TAnyObject = {}

  // This loop checks to see if the required keys
  // are in the query of the current express
  // request and if the required keys are the correct
  // type.
  for (let [requiredKey, requiredType] of Object.entries(requiredQueryKeys)) {
    // If the current required key is not in the query
    // then an error is thrown
    if (!(requiredKey in query)) {
      throw new Error(
        `Bad Request_"${requiredKey}"-is-missing-in-the-query-of-the-request`,
      )
    }

    // If the current required key is in the query
    // then the validator function is called to validate
    // the type of the current key in the query
    let validation: null | Error = validateTypeOfQueryKey(
      query,
      requiredKey,
      requiredType as TQueryValue,
    )

    // If null is returned by the validator function then
    // the value of the current key in the query
    // is the correct type and is added to the sanitized
    // object
    if (validation === null || validation === undefined) {
      sanitizedObject[requiredKey] = query[requiredKey]
    } else {
      throw validation
    }
  }

  // This loop checks to see if the optional keys
  // are in the query of the current express
  // request and if the optional keys are the correct
  // type.
  if (optionalQueryKeys) {
    for (let [optionalKey, optionalType] of Object.entries(optionalQueryKeys)) {
      if (optionalKey in query) {
        // If the current optional key is in the query
        // then the validator function is called to validate
        // the type of the current key in the query
        let validation: null | Error = validateTypeOfQueryKey(
          query,
          optionalKey,
          optionalType as TQueryValue,
        )

        // If null is returned by the validator function then
        // the value of the current key in the query
        // is the correct type and is added to the sanitized
        // object
        if (validation === null || validation === undefined) {
          sanitizedObject[optionalKey] = query[optionalKey]
        } else {
          throw validation
        }
      }
    }
  }

  return sanitizedObject
}

/**
 * This function is used to validate the params of a request
 * based on the schema structure.
 * It will check to see if the specified key's value(s) sent
 * in the params of the current request are the correct type.
 * If all the keys and their values are the correct type,
 * then a sanitized object is returned with the correct
 * keys and their values (extra data that is not
 * specifically defined will be removed). However, if any
 * of the key's values are the incorrect type, then an
 * error is thrown.
 * @param params The params of the request
 * @param requiredParamsKeys The required keys and their types
 * @returns A sanitized object with the correct keys and their values or an error
 */
const validateParamKeys = (
  params: TAnyObject,
  requiredParamsKeys: {},
): TAnyObject | Error => {
  let sanitizedObject: TAnyObject = {}

  // This loop checks to see if the required keys
  // are in the params of the current express
  // request and if the required keys are the correct
  // type.
  for (let [requiredKey, requiredType] of Object.entries(requiredParamsKeys)) {
    // If the current required key is not in the params
    // then an error is thrown
    if (!(requiredKey in params)) {
      throw new Error(
        `Bad Request_"${requiredKey}"-is-missing-in-the-params-of-the-request`,
      )
    }

    // If the current required key is in the params
    // then the validator function is called to validate
    // the type of the current key in the params
    let validation: Error | null = validateTypeOfParamsKey(
      params,
      requiredKey,
      requiredType as TParamValue,
    )

    // If null is returned by the validator function then
    // the value of the current key in the params
    // is the correct type and is added to the sanitized
    // object
    if (validation === null || validation === undefined) {
      sanitizedObject[requiredKey] = params[requiredKey]
    } else {
      throw validation
    }
  }

  return sanitizedObject
}

// ------- MIDDLEWARE FUNCTION(S) ------- //

/**
 * This function is used to validate the request body, query,
 * and params of an express request. It will check to see if
 * the specified key's value(s) sent in the body, query, or
 * params of the current request are the correct type.
 * If all the keys and their values are the correct type,
 * then the request body, query, or params is sanitized
 * and the next middleware function is called. However, if any
 * of the key's values are the incorrect type, then a bad request
 * (400) response is sent.
 * @param requiredStructures The required keys and their types
 * @param optionalStructures The optional keys and their types
 * @returns A sanitized body, query, or params of a request
 * with validated keys and their values or a bad request (400)
 * response
 */
export const defineRequests = (
  requiredStructures: {
    body?: {
      [key: string]: RequestBodyFilters
    }
    query?: {
      [key: string]: TQueryValue
    }
    params?: {
      [key: string]: TParamValue
    }
  },
  optionalStructures?: {
    body?: { [key: string]: RequestBodyFilters }
    query?: {
      [key: string]: TQueryValue
    }
  },
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      if (requiredStructures.query || optionalStructures?.query) {
        // If an API route has a defined query with required
        // or optional keys, then validate the query keys and
        // their values
        let sanitizedQuery: TAnyObject = validateQueryKeys(
          request.query,
          requiredStructures?.query ?? {},
          optionalStructures?.query ?? {},
        )

        // Set the request query to the sanitized query
        request.query = sanitizedQuery
      }

      if (requiredStructures.params) {
        // If an API route has a defined params with required
        // or optional keys, then validate the params keys and
        // their values
        let sanitizedParams: TAnyObject = validateParamKeys(
          request.params,
          requiredStructures.params,
        )

        // Set the request params to the sanitized params
        request.params = sanitizedParams
      }

      if (requiredStructures.body || optionalStructures?.body) {
        // If an API route has a defined body with required
        // or optional keys, then validate the body keys and
        // their values
        let sanitizedBody: TAnyObject = validateBodyKeys(
          request.body,
          requiredStructures?.body ?? {},
          optionalStructures?.body ?? {},
        )

        // Set the request body to the sanitized body
        request.body = sanitizedBody
      }

      // After all validation, call the next middleware
      // function.
      next()
    } catch (error: any) {
      // If an error is thrown by any of the validation
      // checks, then mark the response as a bad request
      // and store the error message in the response.
      response.statusMessage = error.message
      response.status(400)
      response.send()
    }
  }
}

/* -- TYPES -- */

/**
 * The different types that can be passed in the query
 * of a request.
 */
export type TQueryValue =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'objectId'

/**
 * The different types that can be passed in the params
 * of a request.
 */
export type TParamValue = 'string' | 'number' | 'objectId'

export default defineRequests
