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
  // This filters a string included
  // in a request body.
  static STRING(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string') {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 50 characters.
  static STRING_50_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 50) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 128 characters.
  static STRING_128_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 128) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 255 characters.
  static STRING_255_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 255) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 256 characters.
  static STRING_256_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 256) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 512 characters.
  static STRING_512_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 512) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 1024 characters.
  static STRING_1024_CHAR(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 1024) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 16,777,215 characters.
  static STRING_MEDIUMTEXT(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'string' || bodyValue.length > 16777215) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a number included
  // in a request body.
  static NUMBER(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'number' || isNaN(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a boolean included
  // in a request body.
  static BOOLEAN(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue === 'number' || typeof bodyValue === 'boolean') {
      let valueAsStr: string = bodyValue.toString()

      if (!booleanValues.includes(valueAsStr)) {
        throw invalidRequestBodyPropertyException(bodyKey, valueAsStr)
      }
    } else if (typeof bodyValue === 'string') {
      if (!booleanValues.includes(bodyValue)) {
        throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
      }
    }
  }

  // This filters an object included
  // in a request body.
  static OBJECT(bodyKey: string, bodyValue: any) {
    if (typeof bodyValue !== 'object') {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  static OBJECTID(bodyKey: string, bodyValue: any) {
    if (!isObjectIdOrHexString(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }
}

// ------- INTERNAL FUNCTIONS ------- //

// This exception is raised when a property in
// the request body of a post request is invalid
const invalidRequestBodyPropertyException = (
  key: string,
  value: any,
): string => {
  return `Bad Request_{"${key}": "${value}"}-is-invalid`
}

// Validates the type of keys that are passed in
// the request query
const validateTypeOfQueryKey = (
  type: string,
  query: AnyObject,
  key: string,
): void | Error => {
  let errorMessage: string = `Bad Request_query-key-type-required="${type}"_query-key-type-sent="${query[key]}"`

  // If the property's type from the query in the request is a
  // string then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'string') {
    if (query[key] !== `${query[key]}`) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the query in the request is a
  // number then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'number') {
    if (isNaN(parseFloat(query[key]))) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the query in the request is an
  // integer then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'integer') {
    if (
      isNaN(parseInt(query[key])) ||
      parseInt(query[key]) !== parseFloat(query[key])
    ) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the query in the request is a
  // boolean then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'boolean') {
    if (!booleanValues.includes(query[key])) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the query in the request is an
  // objectId then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'objectId') {
    let isObjectId: boolean = isObjectIdOrHexString(query[key])
    if (!isObjectId) {
      throw new Error(errorMessage)
    }
  }
}

const validateRequiredBodyKeys = (
  allBodyKeys: Array<string>,
  allBodyValues: Array<any>,
  allRequiredKeys: Array<string>,
  allRequiredValues: Array<
    (bodyKey: string, bodyValue: any) => void | AnyObject
  >,
  errorsThrown: Array<any>,
  request: Request,
  response: Response,
) => {
  // Loops through all the body keys that were passed
  // to use as a reference
  allBodyKeys.forEach((bodyKey: string, bodyKeyIndex: number) => {
    let bodyValue: any = allBodyValues[bodyKeyIndex]

    // Loops through all the required keys that were passed
    // and validates them to make sure the request
    // being sent is correct
    allRequiredKeys.forEach((requiredKey: string, requiredKeyIndex: number) => {
      let requiredValue:
        | ((bodyKey: string, bodyValue: any) => void)
        | AnyObject = allRequiredValues[requiredKeyIndex]

      // If a key that is supposed to be in the body of the request is not
      // there then an error is thrown
      if (!allBodyKeys.includes(requiredKey)) {
        let error: any = new Error(
          `Bad Request_"${requiredKey}"-is-missing-in-the-body-of-the-request`,
        )
        errorsThrown.push(error)
      }

      if (
        bodyKey === requiredKey &&
        allRequiredKeys.includes(bodyKey) &&
        typeof requiredValue === 'object'
      ) {
        // Since this is an object, it will recursively
        // call this function until the value is the
        // correct type of function
        validateRequestBodyKeys(request, response, bodyValue, requiredValue)
      } else if (
        bodyKey === requiredKey &&
        allRequiredKeys.includes(bodyKey) &&
        typeof requiredValue === 'function'
      ) {
        try {
          // Runs all the required validator methods from the "RequestBodyFilter"
          // class that were passed in the request
          requiredValue(bodyKey, bodyValue)
        } catch (error) {
          errorsThrown.push(error)
        }
      } else {
        // Removes the key from the request body
        // ! delete request.body[bodyKey]
      }
    })
  })
}

const validateOptionalBodyKeys = (
  allBodyKeys: Array<string>,
  allBodyValues: Array<any>,
  allRequiredKeys: Array<string>,
  allRequiredValues: Array<
    (bodyKey: string, bodyValue: any) => void | AnyObject
  >,
  allOptionalKeys: Array<string>,
  allOptionalValues: Array<
    (bodyKey: string, bodyValue: any) => void | AnyObject
  >,
  errorsThrown: Array<any>,
  request: Request,
  response: Response,
) => {
  // Loops through all the body keys that were passed
  // to use as a reference
  allBodyKeys.forEach((bodyKey: string, bodyKeyIndex: number) => {
    let bodyValue: any = allBodyValues[bodyKeyIndex]

    // Loops through all the required keys that were passed
    // and validates them to make sure the request
    // being sent is correct
    allRequiredKeys.forEach((requiredKey: string, requiredKeyIndex: number) => {
      let requiredValue:
        | ((bodyKey: string, bodyValue: any) => void)
        | AnyObject = allRequiredValues[requiredKeyIndex]

      // Loops through all the optional keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allOptionalKeys.forEach(
        (optionalKey: string, optionalKeyIndex: number) => {
          let optionalValue:
            | ((bodyKey: string, bodyValue: any) => void)
            | AnyObject = allOptionalValues[optionalKeyIndex]

          // If a key that is supposed to be in the body of the request is not
          // there then an error is thrown
          if (!allBodyKeys.includes(requiredKey)) {
            let error: any = new Error(
              `Bad Request_"${requiredKey}"-is-missing-in-the-body-of-the-request`,
            )
            errorsThrown.push(error)
          }

          if (
            bodyKey === requiredKey &&
            allRequiredKeys.includes(bodyKey) &&
            typeof requiredValue === 'object'
          ) {
            // Since this is an object, it will recursively
            // call this function until the value is the
            // correct type of function
            validateRequestBodyKeys(request, response, bodyValue, requiredValue)
          } else if (
            bodyKey === optionalKey &&
            allOptionalKeys.includes(bodyKey) &&
            typeof optionalValue === 'object' &&
            typeof requiredValue === 'object'
          ) {
            // Since this is an object, it will recursively
            // call this function until the value is the
            // correct type of function
            validateRequestBodyKeys(
              request,
              response,
              bodyValue,
              requiredValue,
              optionalValue,
            )
          } else if (
            bodyKey === requiredKey &&
            allRequiredKeys.includes(bodyKey) &&
            typeof requiredValue === 'function'
          ) {
            try {
              // Runs all the required validator methods from the "RequestBodyFilter"
              // class that were passed in the request
              requiredValue(bodyKey, bodyValue)
            } catch (error) {
              errorsThrown.push(error)
            }
          } else if (
            bodyKey === optionalKey &&
            allOptionalKeys.includes(bodyKey) &&
            typeof optionalValue === 'function'
          ) {
            try {
              // Runs all the optional validator methods from the "RequestBodyFilter"
              // class that were passed in the request
              optionalValue(bodyKey, bodyValue)
            } catch (error) {
              errorsThrown.push(error)
            }
          } else {
            // Removes the key from the request body
            // ! delete request.body[bodyKey]
          }
        },
      )
    })
  })
}

/**
 * Recursive function that checks to see
 * if the request body in the current
 * express post request contains the
 * specified keys and if the specified keys
 * are the correct type
 * (i.e., name: "string" or initialResources: "number")
 * @param request The express request
 * @param response The express response
 * @param bodyKeysSent The keys and values that were passed in the body of the request
 * @param requiredBodyKeys The required keys and their types
 * @param optionalBodyKeys The optional keys and their types
 * @returns A middleware function that validates the request body
 * of an express request
 */
const validateRequestBodyKeys = (
  request: Request,
  response: Response,
  bodyKeysSent: {},
  requiredBodyKeys: {},
  optionalBodyKeys?: {},
) => {
  // Grabs all the keys that were passed
  // in the body of the request
  let allBodyKeys: Array<string> = Object.keys(bodyKeysSent)

  // Grabs all the values that were passed
  // in the body of the request
  let allBodyValues: Array<any> = Object.values(bodyKeysSent)

  // Grabs all the required keys
  let allRequiredKeys: Array<string> = Object.keys(requiredBodyKeys)

  // Grabs all the required values which are validator
  // methods from in the "RequestBodyFilters" class
  let allRequiredValues: Array<
    (bodyKey: string, bodyValue: any) => void | AnyObject
  > = Object.values(requiredBodyKeys)

  // Will contain any errors that occur while validating
  // the request body
  let errorsThrown: Array<any> = []

  if (optionalBodyKeys) {
    // Grabs all the optional keys
    let allOptionalKeys: Array<string> = Object.keys(optionalBodyKeys)

    // Grab all the optional values which are validator
    // methods from in the "RequestBodyFilters" class
    let allOptionalValues: Array<
      (bodyKey: string, bodyValue: any) => void | AnyObject
    > = Object.values(optionalBodyKeys)

    validateOptionalBodyKeys(
      allBodyKeys,
      allBodyValues,
      allRequiredKeys,
      allRequiredValues,
      allOptionalKeys,
      allOptionalValues,
      errorsThrown,
      request,
      response,
    )
  } else {
    validateRequiredBodyKeys(
      allBodyKeys,
      allBodyValues,
      allRequiredKeys,
      allRequiredValues,
      errorsThrown,
      request,
      response,
    )
  }

  if (errorsThrown.length > 0) {
    response.status(400)
    response.statusMessage = ''
    errorsThrown.map((error: Error) => {
      response.statusMessage += `_${error.message}`
    })
  }
}

/**
 * This function is used to validate the request query
 * of an express request. It will check to see if the
 * request query in the current express request the
 * specified keys and if the specified keys are the
 * correct type (i.e., missionID: "string")
 * @param requiredQueryKeys The required keys and their types
 * @param request The express request
 * @param response The express response
 * @param next The express next function
 * @returns A middleware function that validates the request query
 * of an express request
 */
const validateRequestQueryKeys = (
  request: Request,
  response: Response,
  requiredQueryKeys: {},
  optionalQueryKeys?: {},
) => {
  let query: any = request.query

  // Grabs all the required keys and what their
  // types should be
  let allRequiredKeys: Array<string> = Object.keys(requiredQueryKeys)
  let allRequiredTypes: Array<string> = Object.values(requiredQueryKeys)

  // Will contain any errors that occur while validating
  let errorsThrown: Array<any> = []

  if (!query) {
    requiredQueryKeys = {}
    allRequiredKeys = []
  }

  // Loops through all the required keys that were passed
  // and validates them to make sure the request
  // being sent is correct
  allRequiredKeys.forEach((requiredKey: string, index: number) => {
    // This is what the property's type will be
    let requiredType: string = allRequiredTypes[index]

    try {
      // If a key that is supposed to be in the request is not there
      // then an error is thrown
      if (!(requiredKey in query)) {
        throw new Error(
          `Bad Request_"${requiredKey}"-is-missing-in-the-query-of-the-request`,
        )
      }
    } catch (error) {
      // Handles either of the errors that have been thrown above
      errorsThrown.push(error)
    }

    try {
      // Validates the type of keys that are passed in the request
      // query
      validateTypeOfQueryKey(requiredType, query, requiredKey)
    } catch (error) {
      // Handles either of the errors that have been thrown above
      errorsThrown.push(error)
    }
  })

  if (optionalQueryKeys) {
    // Grabs all the optional keys and what their
    // types should be
    let allOptionalKeys: Array<string> = Object.keys(optionalQueryKeys)
    let allOptionalTypes: Array<string> = Object.values(optionalQueryKeys)

    // Loops through all the optional keys that were passed
    // and validates them to make sure the request
    // being sent is correct
    allOptionalKeys.forEach((optionalKey: string, index: number) => {
      // This is what the property's type will be
      let optionalType: string = allOptionalTypes[index]

      try {
        if (optionalKey in query) {
          // Validates the type of keys if they are passed in
          // the request query
          validateTypeOfQueryKey(optionalType, query, optionalKey)
        }
      } catch (error) {
        // Handles either of the errors that have been thrown above
        errorsThrown.push(error)
      }
    })
  }

  if (errorsThrown.length > 0) {
    response.status(400)
    response.statusMessage = ''
    errorsThrown.map((error: Error) => {
      response.statusMessage += `_${error.message}`
    })
  }
}

// ------- MIDDLEWARE FUNCTION(S) ------- //

/**
 * This function is used to validate the request body and query
 * of an express request. It will check to see if the request
 * body/queries in the current express request the specified
 * keys and if the specified keys are the correct type
 * (i.e., missionID: "string")
 * @param requiredStructures The required keys and their types
 * @param optionalStructures The optional keys and their types
 * @returns A middleware function that validates the request body and query
 */
export const defineRequests = (
  requiredStructures: {
    body: {}
    query: {}
    params: {}
  },
  optionalStructures?: {
    body?: {}
    query?: {}
    params?: {}
  },
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    validateRequestQueryKeys(
      request,
      response,
      requiredStructures.query,
      optionalStructures?.query,
    )

    validateRequestBodyKeys(
      request,
      response,
      request.body,
      requiredStructures.body,
      optionalStructures ? optionalStructures.body : undefined,
    )

    if (response.statusMessage) {
      response.send(response.statusMessage)
    } else {
      next()
    }
  }
}

export default defineRequests
