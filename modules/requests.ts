// ------- IMPORTS ------- //
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { isObjectIdOrHexString } from 'mongoose'
import { AnyObject } from './toolbox/objects'

// ------- GLOBAL VARIABLES ------- //

let booleanValues: Array<string> = [
  '0',
  '1',
  'true',
  'false',
  'True',
  'False',
  'TRUE',
  'FALSE',
  't',
  'f',
  'T',
  'F',
  'yes',
  'no',
  'Yes',
  'No',
  'YES',
  'NO',
  'y',
  'n',
  'Y',
  'N',
]

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
  static STRING(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue !== 'string') {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a string included in a request body, limiting it to 50 characters.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  static STRING_50_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_128_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_255_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_256_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_512_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_1024_CHAR(bodyKey: string, bodyValue: any): Error | null {
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
  static STRING_MEDIUMTEXT(bodyKey: string, bodyValue: any): Error | null {
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
  static NUMBER(bodyKey: string, bodyValue: any): Error | null {
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
  static BOOLEAN(bodyKey: string, bodyValue: any): Error | null {
    if (typeof bodyValue === 'number' || typeof bodyValue === 'boolean') {
      let valueAsStr: string = bodyValue.toString()

      if (!booleanValues.includes(valueAsStr)) {
        throw new Error(
          invalidRequestBodyPropertyException(bodyKey, valueAsStr),
        )
      } else {
        return null
      }
    } else if (typeof bodyValue === 'string') {
      if (!booleanValues.includes(bodyValue)) {
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
  static OBJECT(bodyKey: string, bodyValue: any): Error | null {
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
  static OBJECTID(bodyKey: string, bodyValue: any): Error | null {
    if (!isObjectIdOrHexString(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }

  /**
   * This filters a password included in a request body.
   * @param bodyKey The key of the property in the request body
   * @param bodyValue The value of the property in the request body
   * @returns An error message or null
   */
  static PASSWORD(bodyKey: string, bodyValue: any): Error | null {
    let passwordRegex: RegExp = /^([^\s]{8,50})$/
    let passwordIsValid: boolean = passwordRegex.test(bodyValue)

    if (typeof bodyValue !== 'string' || !passwordIsValid) {
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
  static ARRAY(bodyKey: string, bodyValue: any): Error | null {
    if (!Array.isArray(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    } else {
      return null
    }
  }
}

// ------- INTERNAL FUNCTIONS ------- //

/**
 * This function is used to create an error message
 * when a property in the request body of a post
 * request is invalid.
 * @param key The key that was passed in the request body
 * @param value The value that was passed in the request body
 * @returns An error message
 */
const invalidRequestBodyPropertyException = (
  key: string,
  value: any,
): string => {
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
  query: AnyObject,
  key: string,
  type: string,
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
    if (!booleanValues.includes(query[key])) {
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
  params: AnyObject,
  key: string,
  type: string,
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
 * Recursive function that checks to see
 * if the request body in the current
 * express request contains the
 * specified keys and if the specified keys
 * are the correct type
 * (i.e., key: "string")
 * @param request The express request
 * @param response The express response
 * @param requiredBodyKeys The required keys and their types
 * @param optionalBodyKeys The optional keys and their types
 * @returns A body with the sanitized keys and values
 */
const validateBodyKeys = (
  request: Request,
  response: Response,
  body: AnyObject,
  requiredBodyKeys: {},
  optionalBodyKeys: {},
  sanitizedObject: AnyObject = {},
): AnyObject => {
  // This loop checks to see if the required keys
  // are in the request body of the current express
  // request and if the required keys are the correct
  // type. There is a possibility of nested objects
  // in the request body, so this function is recursive.
  for (let [requiredKey, requiredValue] of Object.entries(requiredBodyKeys)) {
    try {
      // This is the value of the current key in the
      // request body
      let bodyValue: any = body[requiredKey]

      // If the current required key is not in the request
      // body then an error is thrown
      if (!(requiredKey in body)) {
        throw new Error(
          `Bad Request_"${requiredKey}"-is-missing-in-the-body-of-the-request`,
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
        if (validation === null) {
          sanitizedObject[requiredKey] = bodyValue
        }
      }
      // If the current required key is in the request body
      // and the value is an object, then the validateBodyKeys
      // function is called recursively to validate the
      // nested object
      else if (typeof requiredValue === 'object') {
        sanitizedObject[requiredKey] = validateBodyKeys(
          request,
          response,
          bodyValue,
          requiredValue as AnyObject,
          {},
        )
      }
    } catch (error: any) {
      response.statusMessage = error
      response.status(400)
    }
  }

  // This loop checks to see if the optional keys
  // are in the request body of the current express
  // request and if the optional keys are the correct
  // type. There is a possibility of nested objects
  // in the request body, so this function is recursive.
  for (let [optionalKey, optionalValue] of Object.entries(optionalBodyKeys)) {
    try {
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
          if (validation === null) {
            sanitizedObject[optionalKey] = bodyValue
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
            request,
            response,
            bodyValue,
            {},
            optionalValue as AnyObject,
            sanitizedObject[optionalKey],
          )
        }
      }
    } catch (error: any) {
      response.statusMessage = error
      response.status(400)
    }
  }

  return sanitizedObject
}

/**
 * This function is used to validate the request query
 * of an express request. It will check to see if the
 * specified keys sent in the query of the current
 * express request are the correct type.
 * (i.e., key: "string")
 * @param request The express request
 * @param response The express response
 * @param requiredQueryKeys The required keys and their types
 * @returns A query with the sanitized keys and values
 */
const validateQueryKeys = (
  request: Request,
  response: Response,
  requiredQueryKeys: {},
  optionalQueryKeys?: {},
): AnyObject => {
  let query: any = request.query
  let sanitizedObject: AnyObject = {}

  // This loop checks to see if the required keys
  // are in the query of the current express
  // request and if the required keys are the correct
  // type.
  for (let [requiredKey, requiredType] of Object.entries(requiredQueryKeys)) {
    try {
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
        requiredType as string,
      )

      // If null is returned by the validator function then
      // the value of the current key in the query
      // is the correct type and is added to the sanitized
      // object
      if (validation === null) {
        sanitizedObject[requiredKey] = query[requiredKey]
      }
    } catch (error: any) {
      response.statusMessage = error
      response.status(400)
    }
  }

  // This loop checks to see if the optional keys
  // are in the query of the current express
  // request and if the optional keys are the correct
  // type.
  if (optionalQueryKeys) {
    for (let [optionalKey, optionalType] of Object.entries(optionalQueryKeys)) {
      try {
        if (optionalKey in query) {
          // If the current optional key is in the query
          // then the validator function is called to validate
          // the type of the current key in the query
          let validation: null | Error = validateTypeOfQueryKey(
            query,
            optionalKey,
            optionalType as string,
          )

          // If null is returned by the validator function then
          // the value of the current key in the query
          // is the correct type and is added to the sanitized
          // object
          if (validation === null) {
            sanitizedObject[optionalKey] = query[optionalKey]
          }
        }
      } catch (error: any) {
        response.statusMessage = error
        response.status(400)
      }
    }
  }

  return sanitizedObject
}

/**
 * This function is used to validate the request params
 * of an express request. It will check to see if the
 * specified keys sent in the params of the current
 * express request are the correct type.
 * (i.e., key: "string")
 * @param request The express request
 * @param response The express response
 * @param requiredParamsKeys The required keys and their types
 * @returns A params with the sanitized keys and values
 */
const validateParamKeys = (
  request: Request,
  response: Response,
  requiredParamsKeys: {},
): AnyObject => {
  let params: any = request.params
  let sanitizedObject: AnyObject = {}

  // This loop checks to see if the required keys
  // are in the params of the current express
  // request and if the required keys are the correct
  // type.
  for (let [requiredKey, requiredType] of Object.entries(requiredParamsKeys)) {
    try {
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
        requiredType as string,
      )

      // If null is returned by the validator function then
      // the value of the current key in the params
      // is the correct type and is added to the sanitized
      // object
      if (validation === null) {
        sanitizedObject[requiredKey] = params[requiredKey]
      }
    } catch (error: any) {
      response.statusMessage = error
      response.status(400)
    }
  }

  return sanitizedObject
}

// ------- MIDDLEWARE FUNCTION(S) ------- //

/**
 * This function is used to validate the request body, query,
 * and params of an express request. It will check to see if the
 * specified keys sent in the body, query, and params of the
 * current express request are the correct type.
 * (i.e., key: "string")
 * @param requiredStructures The required keys and their types
 * @param optionalStructures The optional keys and their types
 * @returns A middleware function that validates the body, query,
 * and params of an express request
 */
export const defineRequests = (
  requiredStructures: {
    body?: {}
    query?: {}
    params?: {}
  },
  optionalStructures?: {
    body?: {}
    query?: {}
  },
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (requiredStructures.query) {
      let sanitizedQuery: AnyObject = validateQueryKeys(
        request,
        response,
        requiredStructures.query,
        optionalStructures ? optionalStructures.query : undefined,
      )
      request.query = sanitizedQuery
    } else if (requiredStructures.params) {
      let sanitizedParams: AnyObject = validateParamKeys(
        request,
        response,
        requiredStructures.params,
      )
      request.params = sanitizedParams
    } else if (requiredStructures.body) {
      if (optionalStructures && optionalStructures.body) {
        let sanitizedBody: AnyObject = validateBodyKeys(
          request,
          response,
          request.body,
          requiredStructures.body,
          optionalStructures.body,
        )
        request.body = sanitizedBody
      } else {
        let sanitizedBody: AnyObject = validateBodyKeys(
          request,
          response,
          request.body,
          requiredStructures.body,
          {},
        )
        request.body = sanitizedBody
      }
    }

    if (response.statusCode === 400) {
      response.send(response.statusMessage)
    } else {
      next()
    }
  }
}

export default defineRequests
