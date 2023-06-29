// ------- IMPORTS ------- //
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { isObjectIdOrHexString, ObjectId } from 'mongoose'
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
  static STRING(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 50 characters.
  static STRING_50_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 50) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 50) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 128 characters.
  static STRING_128_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 128) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 128) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 255 characters.
  static STRING_255_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 255) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 255) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 256 characters.
  static STRING_256_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 256) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 256) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 512 characters.
  static STRING_512_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 512) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 512) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 1024 characters.
  static STRING_1024_CHAR(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 1024) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 1024) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a string included
  // in a request body, limiting it
  // to 16,777,215 characters.
  static STRING_MEDIUMTEXT(request: Request, key: string) {
    if (request.body.mission) {
      let value: string = request.body.mission[key]

      if (typeof value !== 'string' || value.length > 16777215) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: string = request.body[key]

      if (typeof value !== 'string' || value.length > 16777215) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a number included
  // in a request body.
  static NUMBER(request: Request, key: string) {
    if (request.body.mission) {
      let value: number = request.body.mission[key]

      if (typeof value !== 'number') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: number = request.body[key]

      if (typeof value !== 'number') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  // This filters a boolean included
  // in a request body.
  static BOOLEAN(request: Request, key: string) {
    if (request.body.mission) {
      let value: boolean | string | number = request.body.mission[key]

      if (typeof value === 'number' || typeof value === 'boolean') {
        let valueAsStr: string = value.toString()

        if (!booleanValues.includes(valueAsStr)) {
          throw invalidRequestBodyPropertyException(key, valueAsStr)
        }
      } else {
        if (!booleanValues.includes(value)) {
          throw new Error(invalidRequestBodyPropertyException(key, value))
        }
      }
    } else {
      let value: boolean | string | number = request.body[key]

      if (typeof value === 'number' || typeof value === 'boolean') {
        let valueAsStr: string = value.toString()

        if (!booleanValues.includes(valueAsStr)) {
          throw invalidRequestBodyPropertyException(key, valueAsStr)
        }
      } else {
        if (!booleanValues.includes(value)) {
          throw new Error(invalidRequestBodyPropertyException(key, value))
        }
      }
    }
  }

  // This filters an object included
  // in a request body.
  static OBJECT(request: Request, key: string) {
    if (request.body.mission) {
      let value: AnyObject = request.body.mission[key]

      if (typeof value !== 'object') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: AnyObject = request.body[key]

      if (typeof value !== 'object') {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    }
  }

  static OBJECTID(request: Request, key: string) {
    if (request.body.mission) {
      let value: ObjectId = request.body.mission[key]

      if (!isObjectIdOrHexString(value)) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
    } else {
      let value: ObjectId = request.body[key]

      if (!isObjectIdOrHexString(value)) {
        throw new Error(invalidRequestBodyPropertyException(key, value))
      }
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

// ------- MIDDLEWARE FUNCTIONS ------- //

// Checks to see if the request body
// in the current express post request
// contains the specified keys and if the
// specified keys are the correct type
// (i.e., name: "string" or initialResources: "number")
export const validateRequestBodyKeys = (
  requiredBodyKeys: {},
  optionalBodyKeys?: {},
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    // Grabs all the required keys
    let allRequiredKeys: Array<string> = Object.keys(requiredBodyKeys)

    // Grabs all the required values which are validator
    // methods from in the "RequestBodyFilters" class
    let requiredValidators: Array<(request: Request, key: string) => void> =
      Object.values(requiredBodyKeys)

    let errorsThrown: Array<any> = []

    if (!request.body && !request.body.mission) {
      requiredBodyKeys = {}
      allRequiredKeys = []
    }

    // Loops through all the required keys that were passed
    // and validates them to make sure the request
    // being sent is correct
    allRequiredKeys.forEach((key: string, index: number) => {
      let requiredValidator: (request: Request, key: string) => void =
        requiredValidators[index]

      // If a mission is being created/updated then the
      // structure of the response.body looks like this:
      // body = { mission: { missionID: string, ... } }
      // Therefore logic is needed to see if body.mission
      // is defined
      if (request.body.mission) {
        try {
          // If a key that is supposed to be in the request is not there
          // then an error is thrown
          if (request.body.mission && !(key in request.body.mission)) {
            throw new Error(
              `Bad Request_"${key}"-is-missing-in-the-body-of-the-request`,
            )
          }

          // Runs all the required validator methods from the "RequestBodyFilter"
          // class that were passed in the request
          requiredValidator(request, key)
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }
      } else {
        // If body.mission is undefined then the data
        // being passed is in a JSON format
        try {
          // If a key that is supposed to be in the request is not there
          // then an error is thrown
          if (request.body && !(key in request.body)) {
            throw new Error(
              `Bad Request_"${key}"-is-missing-in-the-body-of-the-request`,
            )
          }

          // Runs all the required validator methods from the "RequestBodyFilter"
          // class that were passed in the request
          requiredValidator(request, key)
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }
      }
    })

    if (optionalBodyKeys) {
      // Grabs all the optional keys
      let allOptionalKeys: Array<string> = Object.keys(optionalBodyKeys)

      // Grab all the optional values which are validator
      // methods from in the "RequestBodyFilters" class
      let optionalValidators: Array<(request: Request, key: string) => void> =
        Object.values(optionalBodyKeys)

      // Loops through all the optional keys that were passed
      // and validates them to make sure the request
      // being sent is correct
      allOptionalKeys.forEach((key: string, index: number) => {
        let optionalValidator: (request: Request, key: string) => void =
          optionalValidators[index]

        // If a mission is being created/updated then the
        // structure of the response.body looks like this:
        // body = { mission: { missionID: string, ... } }.
        // Therefore logic is needed to see if body.mission
        // is defined and the optional keys are being passed
        // in the request
        if (request.body.mission && key in request.body.mission) {
          try {
            // Runs all the optional validator methods from the "RequestBodyFilter"
            // class that were passed in the request
            optionalValidator(request, key)
          } catch (error) {
            // Handles either of the errors that have been thrown above
            errorsThrown.push(error)
          }
        }

        // If body.mission is undefined then the request.body needs
        // to be validated and the optional keys are being passed
        if (!request.body.mission && key in request.body) {
          try {
            // Runs all the optional validator methods from the "RequestBodyFilter"
            // class that were passed in the request
            optionalValidator(request, key)
          } catch (error) {
            // Handles either of the errors that have been thrown above
            errorsThrown.push(error)
          }
        }
      })
    }

    if (errorsThrown.length === 0) {
      next()
    } else {
      response.status(400)
      response.statusMessage = ''
      errorsThrown.map((error: Error) => {
        response.statusMessage += `_${error.message}`
      })
      response.send(response.statusMessage)
    }
  }
}

// Checks to see if the request query/queries
// in the current express request the specified
// keys and if the specified keys are the correct
// type (i.e., missionID: "string")
export const validateRequestQueryKeys = (bodyKeys: {}) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    let query: AnyObject = Object(request.query)

    // Grabs all the required keys and what their
    // types should be
    let allKeys: Array<string> = Object.keys(bodyKeys)
    let allTypes: Array<string> = Object.values(bodyKeys)

    // Will contain any errors that occur while validating
    let errorsThrown: Array<any> = []

    if (!query) {
      bodyKeys = {}
      allKeys = []
    }

    // Loops through all the required keys that were passed
    // and validates them to make sure the request
    // being sent is correct
    allKeys.forEach((key: string, index: number) => {
      // This is what the property's type will be
      let type: string = allTypes[index]

      // The "missions" and "users" getter routes are set up so that if
      // the "missionID" or "userID" is undefined then the query is set
      // to "{}" and all the missions are returned for the MissionSelectionPage.
      // Therefore, the "missionID" and "userID" values are ignored so that the other
      // GET routes that don't require "missionID" and "userID" can be validated properly
      if (key !== 'missionID' && key !== 'userID') {
        try {
          // If a key that is supposed to be in the request is not there
          // then an error is thrown
          if (!(key in query)) {
            throw new Error(
              `Bad Request_"${key}"-is-missing-in-the-query-of-the-request`,
            )
          }
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }

        try {
          // Validates the type of keys that are passed in the request
          // query
          validateTypeOfQueryKey(type, query, key)
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }
      } else if ((key === 'missionID' || key === 'userID') && key in query) {
        // If the key is "missionID" or "userID" then it is a special exception
        // because this key needs to be allowed to be undefined so that all the
        // missions can be returned and displayed on the MissionSelectionPage.
        // Since this key is allowed to be undefined that means only its type
        // needs to be validated
        try {
          // Validates the type of keys that are passed in the request
          // query
          validateTypeOfQueryKey(type, query, key)
        } catch (error) {
          // Handles either of the errors that have been thrown above
          errorsThrown.push(error)
        }
      }
    })

    if (errorsThrown.length === 0) {
      next()
    } else {
      response.status(400)
      response.statusMessage = ''
      errorsThrown.map((error: Error) => {
        response.statusMessage += `_${error.message}`
      })
      response.send(response.statusMessage)
    }
  }
}

export default validateRequestBodyKeys
validateRequestQueryKeys
