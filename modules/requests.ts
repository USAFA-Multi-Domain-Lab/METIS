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
    if (typeof bodyValue !== 'object' || Array.isArray(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters an ObjectID included
  // in a request body.
  static OBJECTID(bodyKey: string, bodyValue: any) {
    if (!isObjectIdOrHexString(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  // This filters a password included
  // in a request body.
  static PASSWORD(bodyKey: string, bodyValue: any) {
    let passwordRegex: RegExp = /^([^\s]{8,50})$/
    let passwordIsValid: boolean = passwordRegex.test(bodyValue)

    if (typeof bodyValue !== 'string' || !passwordIsValid) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
    }
  }

  static ARRAY(bodyKey: string, bodyValue: any) {
    if (!Array.isArray(bodyValue)) {
      throw new Error(invalidRequestBodyPropertyException(bodyKey, bodyValue))
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
 * @returns An error message
 */
const validateTypeOfQueryKey = (
  query: AnyObject,
  key: string,
  type: string,
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
  // object then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'object') {
    if (typeof query[key] !== 'object' || Array.isArray(query[key])) {
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

/**
 * Validates the type of keys that are passed in
 * the request params
 * @param params The params in the request
 * @param key The key in the params
 * @param type The type of the property
 * @returns An error message
 */
const validateTypeOfParamsKey = (
  type: string,
  params: AnyObject,
  key: string,
): void | Error => {
  let errorMessage: string = `Bad Request_params-key-type-required="${type}"_params-key-type-sent="${params[key]}"`

  // If the property's type from the params in the request is a
  // string then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'string') {
    if (params[key] !== `${params[key]}`) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the params in the request is a
  // number then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'number') {
    if (isNaN(parseFloat(params[key]))) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the params in the request is an
  // integer then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'integer') {
    if (
      isNaN(parseInt(params[key])) ||
      parseInt(params[key]) !== parseFloat(params[key])
    ) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the params in the request is a
  // boolean then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'boolean') {
    if (!booleanValues.includes(params[key])) {
      throw new Error(errorMessage)
    }
  }

  // If the property's type from the params in the request is an
  // objectId then this validates to make sure the property being
  // sent via the API route is the right type
  if (type === 'objectId') {
    let isObjectId: boolean = isObjectIdOrHexString(params[key])
    if (!isObjectId) {
      throw new Error(errorMessage)
    }
  }
}

/**
 * This function is used to delete extra data that
 * is passed in the body of the request that is not
 * supposed to be there
 * @param requestStartingPoint The starting poing of the request (i.e., request.body, request.query, request.params)
 * @param requestPath The full path needed to get to the extra data
 * @param requestKey The key that needs to be removed
 * @returns A middleware function that validates the request body
 * of an express request
 */
const deleteExtraData = (
  requestStartingPoint: any,
  requestPath: string[],
  requestKey: string,
) => {
  if (requestPath.length > 0) {
    // This is the end of the path of the body
    let lastBodyPathKey: string = requestPath[requestPath.length - 1]

    // Loops through the body path and finds the
    // location of the key that needs to be removed
    requestPath.forEach((requestPathKey: string) => {
      if (
        requestStartingPoint[requestPathKey] &&
        requestPathKey === lastBodyPathKey
      ) {
        let nextLayer: any = requestStartingPoint[requestPathKey]
        requestStartingPoint = nextLayer

        let endOfPathKeys: Array<string> = Object.keys(requestStartingPoint)
        endOfPathKeys.forEach((endOfPathKey: string) => {
          if (endOfPathKey === requestKey) {
            delete requestStartingPoint[endOfPathKey]
          }
        })
      }
    })
  } else {
    let endOfPathKeys: Array<string> = Object.keys(requestStartingPoint)
    endOfPathKeys.forEach((endOfPathKey: string) => {
      if (endOfPathKey === requestKey) {
        delete requestStartingPoint[endOfPathKey]
      }
    })
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
 * @param bodyPath The path of the body
 * @param bodyKeysSent The keys and values that were passed in the body of the request
 * @param requiredBodyKeys The required keys and their types
 * @returns A middleware function that validates the request body
 * of an express request
 */
const validateRequiredBodyKeysOnly = (
  request: Request,
  response: Response,
  bodyPath: string[],
  bodyKeysSent: {},
  requiredBodyKeys: {},
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

  // Grabs the current body location
  let currentBodyLocation: any = request.body

  // Updates the current location in the body
  // of the request
  bodyPath.forEach((bodyPathKey: string) => {
    if (!currentBodyLocation) {
      currentBodyLocation = request.body[bodyPathKey]
    } else {
      currentBodyLocation = currentBodyLocation[bodyPathKey]
    }
  })

  // Will contain any errors that occur while validating
  // the request body
  let errorsThrown: Array<any> = []

  if (!request.body) {
    requiredBodyKeys = {}
    allRequiredKeys = []
  }

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

      if (bodyKey === requiredKey && typeof requiredValue === 'object') {
        // Adds the current key to the body path
        // which is used as a reference when deleting extra
        // data from the body of the request
        bodyPath.push(bodyKey)

        // Since this is an object, it will recursively
        // call this function until the value is the
        // correct type of function
        validateRequiredBodyKeysOnly(
          request,
          response,
          bodyPath,
          bodyValue,
          requiredValue,
        )
      } else if (
        bodyKey === requiredKey &&
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
        !allRequiredKeys.includes(bodyKey) &&
        currentBodyLocation.hasOwnProperty(bodyKey)
      ) {
        deleteExtraData(request.body, bodyPath, bodyKey)
      }
    })
  })

  if (errorsThrown.length > 0) {
    response.status(400)
    response.statusMessage = ''
    errorsThrown.map((error: Error) => {
      response.statusMessage += `_${error.message}`
    })
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
 * @param bodyPath The path of the body
 * @param bodyKeysSent The keys and values that were passed in the body of the request
 * @param requiredBodyKeys The required keys and their types
 * @param optionalBodyKeys The optional keys and their types
 * @returns A middleware function that validates the request body
 * of an express request
 */
const validateAllBodyKeys = (
  request: Request,
  response: Response,
  bodyPath: string[],
  bodyKeysSent: {},
  requiredBodyKeys: {},
  optionalBodyKeys: {},
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

  // Grabs all the optional keys
  let allOptionalKeys: Array<string> = Object.keys(optionalBodyKeys)

  // Grab all the optional values which are validator
  // methods from in the "RequestBodyFilters" class
  let allOptionalValues: Array<
    (bodyKey: string, bodyValue: any) => void | AnyObject
  > = Object.values(optionalBodyKeys)

  // Grabs the current body location
  let currentBodyLocation: any = request.body

  // Updates the current location in the body
  // of the request
  bodyPath.forEach((bodyPathKey: string) => {
    if (!currentBodyLocation) {
      currentBodyLocation = request.body[bodyPathKey]
    } else {
      currentBodyLocation = currentBodyLocation[bodyPathKey]
    }
  })

  // Will contain any errors that occur while validating
  // the request body
  let errorsThrown: Array<any> = []

  if (!request.body) {
    optionalBodyKeys = {}
    allOptionalKeys = []
  }

  if (allRequiredKeys.length > 0) {
    // Loops through all the body keys that were passed
    // to use as a reference
    allBodyKeys.forEach((bodyKey: string, bodyKeyIndex: number) => {
      let bodyValue: any = allBodyValues[bodyKeyIndex]

      // Loops through all the required keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allRequiredKeys.forEach(
        (requiredKey: string, requiredKeyIndex: number) => {
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

          // Loops through all the optional keys that were passed
          // and validates them to make sure the request
          // being sent is correct
          allOptionalKeys.forEach(
            (optionalKey: string, optionalKeyIndex: number) => {
              let optionalValue:
                | ((bodyKey: string, bodyValue: any) => void)
                | AnyObject = allOptionalValues[optionalKeyIndex]

              if (
                bodyKey === optionalKey &&
                requiredKey === optionalKey &&
                typeof requiredValue === 'object' &&
                typeof optionalValue === 'object'
              ) {
                // Adds the current key to the body path
                bodyPath.push(bodyKey)

                // Since this is an object, it will recursively
                // call this function until the value is the
                // correct type of function
                validateAllBodyKeys(
                  request,
                  response,
                  bodyPath,
                  bodyValue,
                  requiredValue,
                  optionalValue,
                )
              } else if (
                bodyKey === requiredKey &&
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
                typeof optionalValue === 'function'
              ) {
                try {
                  // Runs all the optional validator methods from the "RequestBodyFilter"
                  // class that were passed in the request
                  optionalValue(bodyKey, bodyValue)
                } catch (error) {
                  errorsThrown.push(error)
                }
              } else if (
                !allRequiredKeys.includes(bodyKey) &&
                !allOptionalKeys.includes(bodyKey) &&
                currentBodyLocation.hasOwnProperty(bodyKey)
              ) {
                deleteExtraData(request.body, bodyPath, bodyKey)
              }
            },
          )
        },
      )
    })
  } else {
    // Loops through all the body keys that were passed
    // to use as a reference
    allBodyKeys.forEach((bodyKey: string, bodyKeyIndex: number) => {
      let bodyValue: any = allBodyValues[bodyKeyIndex]

      // Loops through all the optional keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allOptionalKeys.forEach(
        (optionalKey: string, optionalKeyIndex: number) => {
          let optionalValue:
            | ((bodyKey: string, bodyValue: any) => void)
            | AnyObject = allOptionalValues[optionalKeyIndex]

          if (bodyKey === optionalKey && typeof optionalValue === 'object') {
            // Adds the current key to the body path
            bodyPath.push(bodyKey)

            // Since this is an object, it will recursively
            // call this function until the value is the
            // correct type of function
            validateAllBodyKeys(
              request,
              response,
              bodyPath,
              bodyValue,
              {},
              optionalValue,
            )
          } else if (
            bodyKey === optionalKey &&
            typeof optionalValue === 'function'
          ) {
            try {
              // Runs all the optional validator methods from the "RequestBodyFilter"
              // class that were passed in the request
              optionalValue(bodyKey, bodyValue)
            } catch (error) {
              errorsThrown.push(error)
            }
          } else if (
            !allOptionalKeys.includes(bodyKey) &&
            currentBodyLocation.hasOwnProperty(bodyKey)
          ) {
            deleteExtraData(request.body, bodyPath, bodyKey)
          }
        },
      )
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

/**
 * This function is used to validate the request query
 * of an express request. It will check to see if the
 * specified keys sent in the query of the current
 * express request are the correct type.
 * (i.e., key: "string")
 * @param request The express request
 * @param response The express response
 * @param requiredQueryKeys The required keys and their types
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

  // This is used for the "deleteExtraData function"
  let queryPath: Array<string> = ['query']

  // Grabs all the keys that were passed
  // in the query of the request
  let allQueryKeys: Array<string> = Object.keys(query)

  // Grabs all the required keys and what their
  // types should be
  let allRequiredKeys: Array<string> = Object.keys(requiredQueryKeys)
  let allRequiredTypes: Array<string> = Object.values(requiredQueryKeys)

  // Grabs all the optional keys and what their
  // types should be
  let allOptionalKeys: Array<string>
  let allOptionalTypes: Array<string>

  // Will contain any errors that occur while validating
  let errorsThrown: Array<any> = []

  if (!query) {
    requiredQueryKeys = {}
    allRequiredKeys = []
  }

  if (optionalQueryKeys && allRequiredKeys.length > 0) {
    allOptionalKeys = Object.keys(optionalQueryKeys)
    allOptionalTypes = Object.values(optionalQueryKeys)

    // Loops through all the query keys that were passed
    // to use as a reference
    allQueryKeys.forEach((queryKey: string) => {
      // Loops through all the required keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allRequiredKeys.forEach((requiredKey: string, requiredIndex: number) => {
        // This is what the property's type will be
        let requiredType: string = allRequiredTypes[requiredIndex]

        try {
          // If a key that is supposed to be in the request is not there
          // then an error is thrown
          if (!allQueryKeys.includes(requiredKey)) {
            throw new Error(
              `Bad Request_"${requiredKey}"-is-missing-in-the-query-of-the-request`,
            )
          }
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }

        // Loops through all the optional keys that were passed
        // and validates them to make sure the request
        // being sent is correct
        allOptionalKeys.forEach((optionalKey: string, index: number) => {
          // This is what the property's type will be
          let optionalType: string = allOptionalTypes[index]

          if (queryKey === requiredKey) {
            try {
              // Validates the type of keys that are passed in the request
              // query
              validateTypeOfQueryKey(query, requiredKey, requiredType)
            } catch (error) {
              // Handles either of the errors that have been thrown above
              errorsThrown.push(error)
            }
          } else if (queryKey === optionalKey) {
            try {
              // Validates the type of keys if they are passed in
              // the request query
              validateTypeOfQueryKey(query, optionalKey, optionalType)
            } catch (error) {
              // Handles either of the errors that have been thrown above
              errorsThrown.push(error)
            }
          } else if (
            !allRequiredKeys.includes(queryKey) &&
            !allOptionalKeys.includes(queryKey) &&
            query.hasOwnProperty(queryKey)
          ) {
            deleteExtraData(request, queryPath, queryKey)
          }
        })
      })
    })
  } else if (optionalQueryKeys && allRequiredKeys.length === 0) {
    allOptionalKeys = Object.keys(optionalQueryKeys)
    allOptionalTypes = Object.values(optionalQueryKeys)

    // Loops through all the query keys that were passed
    // to use as a reference
    allQueryKeys.forEach((queryKey: string) => {
      // Loops through all the optional keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allOptionalKeys.forEach((optionalKey: string, index: number) => {
        // This is what the property's type will be
        let optionalType: string = allOptionalTypes[index]

        if (queryKey === optionalKey) {
          try {
            // Validates the type of keys if they are passed in
            // the request query
            validateTypeOfQueryKey(query, optionalKey, optionalType)
          } catch (error) {
            // Handles either of the errors that have been thrown above
            errorsThrown.push(error)
          }
        } else if (
          !allOptionalKeys.includes(queryKey) &&
          query.hasOwnProperty(queryKey)
        ) {
          deleteExtraData(request, queryPath, queryKey)
        }
      })
    })
  } else if (!optionalQueryKeys && allRequiredKeys.length > 0) {
    // Loops through all the query keys that were passed
    // to use as a reference
    allQueryKeys.forEach((queryKey: string) => {
      // Loops through all the required keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allRequiredKeys.forEach((requiredKey: string, requiredIndex: number) => {
        // This is what the property's type will be
        let requiredType: string = allRequiredTypes[requiredIndex]

        try {
          // If a key that is supposed to be in the request is not there
          // then an error is thrown
          if (!allQueryKeys.includes(requiredKey)) {
            throw new Error(
              `Bad Request_"${requiredKey}"-is-missing-in-the-query-of-the-request`,
            )
          }
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }

        if (queryKey === requiredKey) {
          try {
            // Validates the type of keys that are passed in the request
            // query
            validateTypeOfQueryKey(query, requiredKey, requiredType)
          } catch (error) {
            // Handles either of the errors that have been thrown above
            errorsThrown.push(error)
          }
        } else if (
          !allRequiredKeys.includes(queryKey) &&
          query.hasOwnProperty(queryKey)
        ) {
          deleteExtraData(request, queryPath, queryKey)
        }
      })
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

/**
 * This function is used to validate the request params
 * of an express request. It will check to see if the
 * specified keys sent in the params of the current
 * express request are the correct type.
 * (i.e., key: "string")
 * @param requiredParamsKeys The required keys and their types
 * @param request The express request
 * @param response The express response
 * @returns A middleware function that validates the request params
 * of an express request
 */
const validateRequiredParamsKeys = (
  request: Request,
  response: Response,
  requiredParamsKeys: {},
) => {
  let params: any = request.params

  // Grabs all the keys that were passed
  // in the query of the request
  let allParamsKeys: Array<string> = Object.keys(params)

  // Grabs all the required keys and what their
  // types should be
  let allRequiredKeys: Array<string> = Object.keys(requiredParamsKeys)
  let allRequiredTypes: Array<string> = Object.values(requiredParamsKeys)

  // Will contain any errors that occur while validating
  let errorsThrown: Array<any> = []

  if (!params) {
    requiredParamsKeys = {}
    allRequiredKeys = []
  }

  // Loops through all the params keys that were passed
  // to use as a reference
  allParamsKeys.forEach((paramsKey: string) => {
    // Loops through all the required keys that were passed
    // and validates them to make sure the request
    // being sent is correct

    allRequiredKeys.forEach((requiredKey: string, index: number) => {
      // This is what the property's type will be
      let requiredType: string = allRequiredTypes[index]

      try {
        // If a key that is supposed to be in the request is not there
        // then an error is thrown
        if (!allParamsKeys.includes(requiredKey)) {
          throw new Error(
            `Bad Request_"${requiredKey}"-is-missing-in-the-params-of-the-request`,
          )
        }
      } catch (error) {
        // Handles either of the errors that have been thrown above
        errorsThrown.push(error)
      }

      if (paramsKey === requiredKey) {
        try {
          // Validates the type of keys that are passed in the request
          // params
          validateTypeOfParamsKey(requiredType, params, requiredKey)
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }
      }
    })
  })

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
      validateRequestQueryKeys(
        request,
        response,
        requiredStructures.query,
        optionalStructures ? optionalStructures.query : undefined,
      )
    } else if (requiredStructures.params) {
      validateRequiredParamsKeys(request, response, requiredStructures.params)
    } else if (requiredStructures.body) {
      if (optionalStructures && optionalStructures.body) {
        validateAllBodyKeys(
          request,
          response,
          [],
          request.body,
          requiredStructures.body,
          optionalStructures.body,
        )
      } else {
        validateRequiredBodyKeysOnly(
          request,
          response,
          [],
          request.body,
          requiredStructures.body,
        )
      }
    }

    if (response.statusMessage) {
      response.send(response.statusMessage)
    } else {
      next()
    }
  }
}

export default defineRequests
