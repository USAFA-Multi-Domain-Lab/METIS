import { AnyObject } from 'metis/toolbox/objects'

const executeAscotDemoRequest = async (args: AnyObject): Promise<void> => {
  // Extract the arguments needed to make
  // the API request.
  let { entityName, heading, altitude, kill } = args

  try {
    // If heading is given, and its value type
    // is correct, make the API request.
    if (
      typeof entityName === 'string' &&
      typeof heading === 'object' &&
      typeof heading.unit === 'string' &&
      typeof heading.value === 'number'
    ) {
      console.log({
        requestMethod: 'PATCH',
        requestData: { heading: heading },
        requestPath: 'heading',
        targetName: entityName,
      })
    }
    // If altitude is given, and its value type
    // is correct, make the API request.
    else if (
      typeof entityName === 'string' &&
      typeof altitude === 'object' &&
      typeof altitude.unit === 'string' &&
      typeof altitude.value === 'number'
    ) {
      console.log({
        requestMethod: 'PATCH',
        requestData: { altitude: altitude },
        requestPath: 'altitude',
        targetName: entityName,
      })
    }
    // If kill is given, and its value type
    // is correct, make the API request.
    else if (typeof entityName === 'string' && typeof kill === 'object') {
      console.log({
        requestMethod: 'POST',
        requestData: {},
        requestPath: 'kill',
        targetName: entityName,
      })
    }
    // Otherwise, a bad request was made.
    else {
      throw new Error(
        'Bad request. The data sent with the request is invalid. Please check your request data.',
      )
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

// executeAscotDemoRequest({
//   entityName: 'CHENGDU GJ-2',
//   heading: { unit: 'deg', value: 270 },
//   altitude: { unit: 'm', value: 1000 },
//   kill: {},
// })
// executeAscotDemoRequest({
//   entityName: 'CHENGDU GJ-2',
//   heading: { unit: 'deg', value: 270 },
// })
// // ! Bad request
// executeAscotDemoRequest({
//   entityName: 'CHENGDU GJ-2',
//   heading: { unit: 'deg', value: '270' },
// })

/* -------------------------------------------------------------------------- */

const executeBankRequest = async (args: AnyObject): Promise<void> => {
  // Extract the arguments needed to make
  // the API request.
  let { color } = args

  try {
    // If the required properties are given and
    // their value types are correct, make the
    // API request.
    if (typeof color === 'string') {
      console.log({
        requestMethod: 'PUT',
        requestData: { color: color },
        requestPath: 'bank',
      })
    }
    // Otherwise, a bad request was made.
    else {
      throw new Error(
        'Bad request. The data sent with the request is invalid. Please check your request data.',
      )
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

// executeBankRequest({ color: 'blue' })
// // ! Bad request
// executeBankRequest({ color: 234 })

/* -------------------------------------------------------------------------- */

const executeTrafficRequest = async (args: AnyObject): Promise<void> => {
  // Extract the arguments needed to make
  // the API request.
  let { zone, power, direction, color } = args

  try {
    // If only the required properties are given and
    // their value types are correct, make the
    // API request.
    if (
      typeof zone === 'string' &&
      typeof power === 'string' &&
      typeof direction === 'undefined' &&
      typeof color === 'undefined'
    ) {
      console.log({
        requestMethod: 'PUT',
        requestData: { zone: zone, power: power },
        requestPath: 'traffic',
      })
    }
    // If all the properties are given and
    // their value types are correct, make the
    // API request.
    else if (
      typeof zone === 'string' &&
      typeof power === 'string' &&
      typeof direction === 'string' &&
      typeof color === 'string'
    ) {
      console.log({
        requestMethod: 'PUT',
        requestData: {
          zone: zone,
          power: power,
          direction: direction,
          color: color,
        },
        requestPath: 'traffic',
      })
    }
    // Otherwise, a bad request was made.
    else {
      throw new Error(
        'Bad request. The data sent with the request is invalid. Please check your request data.',
      )
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

// executeTrafficRequest({ zone: 'commercial', power: 'ON' })
// executeTrafficRequest({
//   zone: 'commercial',
//   power: 'ON',
//   direction: 'north',
//   color: 'red',
// })
// // ! Bad request
// executeTrafficRequest({ zone: 'commercial', power: 'ON', direction: 234 })
