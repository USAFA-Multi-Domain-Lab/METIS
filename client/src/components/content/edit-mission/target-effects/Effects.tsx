import Tooltip from '../../communication/Tooltip'
import './Effects.scss'
import { compute } from 'src/toolbox'
import { ClientTargetEnvironment } from 'src/target-environments'
import { ClientEffect } from 'src/missions/effects'
import { useEffect, useState } from 'react'
import { AnyObject } from '../../../../../../shared/toolbox/objects'
import ClientMissionAction from 'src/missions/actions'
import Effect from './Effect'
import { v4 as generateHash } from 'uuid'

/**
 * Affects the bank in Rancho Cucamonga.
 * @param args All the necessary arguments to execute the request.
 */
const affectBank = async (args: AnyObject): Promise<void> => {
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

/**
 * Affects traffic lights in Rancho Cucamonga.
 * @param args All the necessary arguments to execute the request.
 */
const affectTraffic = async (args: AnyObject): Promise<void> => {
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

/**
 * Affects a flying entity in ASCOT.
 * @param args All the necessary arguments to execute the request.
 */
const affectFlyingEntity = async (args: AnyObject): Promise<void> => {
  // Extract the arguments needed to make
  // the API request.
  let { entityName, heading, unit, value, altitude, kill } = args
  let errorMessage: string =
    'Bad request. The data sent with the request is invalid. Please check your request data.'

  try {
    // If entityName is given, and its value type
    // is incorrect, throw an error.
    if (entityName && typeof entityName !== 'string') {
      throw new Error(errorMessage)
    }

    // If heading is given, and its value type
    // is correct, make the API request.
    if (
      typeof heading === 'boolean' &&
      heading === true &&
      typeof unit === 'string' &&
      typeof value === 'number'
    ) {
      console.log({
        requestMethod: 'PATCH',
        requestData: { heading: { unit: unit, value: value } },
        requestPath: 'heading',
        targetName: entityName,
      })
    }
    // If heading is given, and its value type
    // is incorrect, throw an error.
    else if (heading && typeof heading !== 'boolean') {
      throw new Error(errorMessage)
    }
    // If the heading unit is given, and its value type
    // is incorrect, throw an error.
    else if (unit && typeof unit !== 'string') {
      throw new Error(errorMessage)
    }
    // If the heading value is given, and its value type
    // is incorrect, throw an error.
    else if (value && typeof value !== 'number') {
      throw new Error(errorMessage)
    }

    // If altitude is given, and its value type
    // is correct, make the API request.
    if (typeof altitude === 'number') {
      console.log({
        requestMethod: 'PATCH',
        requestData: { altitude: { unit: 'm', value: altitude } },
        requestPath: 'altitude',
        targetName: entityName,
      })
    }
    //  If altitude is given, and its value type
    // is incorrect, throw an error.
    else if (altitude && typeof altitude !== 'number') {
      throw new Error(errorMessage)
    }

    // If kill is given, and its value type
    // is correct, make the API request.
    if (typeof kill === 'boolean' && kill === true) {
      console.log({
        requestMethod: 'POST',
        requestData: {},
        requestPath: 'kill',
        targetName: entityName,
      })
    }
    // If kill is given, and its value type
    // is incorrect, throw an error.
    else if (kill && typeof kill !== 'boolean') {
      throw new Error(errorMessage)
    }
  } catch (error: any) {
    throw new Error(error)
  }
}

const targetEnvironments: ClientTargetEnvironment[] = [
  new ClientTargetEnvironment({
    id: 'ascot',
    name: 'ASCOT',
    description:
      'Advanced Simulation Combat Operations Trainer (ASCOT) is a high-fidelity environment generator designed for military instructors needing real-time, interactive, multi-platform simulation.',
    targets: [
      {
        targetEnvironmentId: 'ascot',
        id: 'flyingEntity',
        name: 'Flying Entity',
        description: 'A flying entity in ASCOT.',
        script: affectFlyingEntity,
        args: [
          {
            id: 'entityName',
            name: 'Entity Name',
            required: true,
            display: true,
            type: 'string',
          },
          {
            id: 'heading',
            name: 'Change Heading',
            required: false,
            display: true,
            groupingId: 'heading',
            type: 'boolean',
            optionalParams: {
              dependencies: ['unit'],
            },
          },
          {
            id: 'unit',
            name: 'Heading Unit',
            required: false,
            display: false,
            groupingId: 'heading',
            type: 'dropdown',
            selected: undefined,
            options: [
              {
                id: 'deg',
                name: 'Degrees',
              },
              {
                id: 'rad',
                name: 'Radians',
              },
            ],
            optionalParams: {
              dependencies: ['value'],
            },
          },
          {
            id: 'value',
            name: 'Heading Value',
            required: false,
            display: false,
            groupingId: 'heading',
            type: 'number',
          },
          {
            id: 'changeAltitude',
            name: 'Change Altitude',
            required: false,
            display: true,
            groupingId: 'changeAltitude',
            type: 'boolean',
            optionalParams: {
              dependencies: ['altitude'],
            },
          },
          {
            id: 'altitude',
            name: 'Altitude Value',
            required: false,
            display: false,
            groupingId: 'changeAltitude',
            type: 'number',
            min: 0,
            max: 10000,
            unit: 'm',
          },
          {
            id: 'kill',
            name: 'Kill the Target',
            required: false,
            display: true,
            type: 'boolean',
          },
        ],
      },
    ],
  }),
  new ClientTargetEnvironment({
    id: 'ranchoCucamonga',
    name: 'Rancho Cucamonga',
    description:
      'Rancho Cucamonga is a scale model of a city used for educating students on network security.',
    targets: [
      {
        targetEnvironmentId: 'ranchoCucamonga',
        id: 'traffic',
        name: 'Traffic Lights',
        description:
          'The traffic lights are located in all four zones (industrial, commercial, residential, and military) within Rancho Cucamonga and are used to control traffic.',
        script: affectTraffic,
        args: [
          {
            id: 'commercial',
            name: 'Commercial',
            required: false,
            display: true,
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'commercialNorth',
                'commercialSouth',
                'commercialEast',
                'commercialWest',
              ],
            },
          },
          {
            id: 'commercialNorth',
            name: 'North - Commercial',
            required: false,
            display: false,
            groupingId: 'commercialNorth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'commercialNorthGreen',
                'commercialNorthYellow',
                'commercialNorthRed',
              ],
            },
          },
          {
            id: 'commercialNorthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'commercialNorth',
            type: 'boolean',
          },
          {
            id: 'commercialNorthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'commercialNorth',
            type: 'boolean',
          },
          {
            id: 'commercialNorthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'commercialNorth',
            type: 'boolean',
          },
          {
            id: 'commercialSouth',
            name: 'South - Commercial',
            required: false,
            display: false,
            groupingId: 'commercialSouth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'commercialSouthGreen',
                'commercialSouthYellow',
                'commercialSouthRed',
              ],
            },
          },
          {
            id: 'commercialSouthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'commercialSouth',
            type: 'boolean',
          },
          {
            id: 'commercialSouthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'commercialSouth',
            type: 'boolean',
          },
          {
            id: 'commercialSouthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'commercialSouth',
            type: 'boolean',
          },
          {
            id: 'commercialEast',
            name: 'East - Commercial',
            required: false,
            display: false,
            groupingId: 'commercialEast',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'commercialEastGreen',
                'commercialEastYellow',
                'commercialEastRed',
              ],
            },
          },
          {
            id: 'commercialEastGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'commercialEast',
            type: 'boolean',
          },
          {
            id: 'commercialEastYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'commercialEast',
            type: 'boolean',
          },
          {
            id: 'commercialEastRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'commercialEast',
            type: 'boolean',
          },
          {
            id: 'commercialWest',
            name: 'West - Commercial',
            required: false,
            display: false,
            groupingId: 'commercialWest',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'commercialWestGreen',
                'commercialWestYellow',
                'commercialWestRed',
              ],
            },
          },
          {
            id: 'commercialWestGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'commercialWest',
            type: 'boolean',
          },
          {
            id: 'commercialWestYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'commercialWest',
            type: 'boolean',
          },
          {
            id: 'commercialWestRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'commercialWest',
            type: 'boolean',
          },
          {
            id: 'industrial',
            name: 'Industrial',
            required: false,
            display: true,
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'industrialNorth',
                'industrialSouth',
                'industrialEast',
                'industrialWest',
              ],
            },
          },
          {
            id: 'industrialNorth',
            name: 'North - Industrial',
            required: false,
            display: false,
            groupingId: 'industrialNorth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'industrialNorthGreen',
                'industrialNorthYellow',
                'industrialNorthRed',
              ],
            },
          },
          {
            id: 'industrialNorthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'industrialNorth',
            type: 'boolean',
          },
          {
            id: 'industrialNorthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'industrialNorth',
            type: 'boolean',
          },
          {
            id: 'industrialNorthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'industrialNorth',
            type: 'boolean',
          },
          {
            id: 'industrialSouth',
            name: 'South - Industrial',
            required: false,
            display: false,
            groupingId: 'industrialSouth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'industrialSouthGreen',
                'industrialSouthYellow',
                'industrialSouthRed',
              ],
            },
          },
          {
            id: 'industrialSouthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'industrialSouth',
            type: 'boolean',
          },
          {
            id: 'industrialSouthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'industrialSouth',
            type: 'boolean',
          },
          {
            id: 'industrialSouthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'industrialSouth',
            type: 'boolean',
          },
          {
            id: 'industrialEast',
            name: 'East - Industrial',
            required: false,
            display: false,
            type: 'boolean',
            groupingId: 'industrialEast',
            optionalParams: {
              dependencies: [
                'industrialEastGreen',
                'industrialEastYellow',
                'industrialEastRed',
              ],
            },
          },
          {
            id: 'industrialEastGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'industrialEast',
            type: 'boolean',
          },
          {
            id: 'industrialEastYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'industrialEast',
            type: 'boolean',
          },
          {
            id: 'industrialEastRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'industrialEast',
            type: 'boolean',
          },
          {
            id: 'industrialWest',
            name: 'West - Industrial',
            required: false,
            display: false,
            groupingId: 'industrialWest',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'industrialWestGreen',
                'industrialWestYellow',
                'industrialWestRed',
              ],
            },
          },
          {
            id: 'industrialWestGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'industrialWest',
            type: 'boolean',
          },
          {
            id: 'industrialWestYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'industrialWest',
            type: 'boolean',
          },
          {
            id: 'industrialWestRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'industrialWest',
            type: 'boolean',
          },
          {
            id: 'residential',
            name: 'Residential',
            required: false,
            display: true,
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'residentialNorth',
                'residentialSouth',
                'residentialEast',
                'residentialWest',
              ],
            },
          },
          {
            id: 'residentialNorth',
            name: 'North - Residential',
            required: false,
            display: false,
            groupingId: 'residentialNorth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'residentialNorthGreen',
                'residentialNorthYellow',
                'residentialNorthRed',
              ],
            },
          },
          {
            id: 'residentialNorthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'residentialNorth',
            type: 'boolean',
          },
          {
            id: 'residentialNorthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'residentialNorth',
            type: 'boolean',
          },
          {
            id: 'residentialNorthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'residentialNorth',
            type: 'boolean',
          },
          {
            id: 'residentialSouth',
            name: 'South - Residential',
            required: false,
            display: false,
            groupingId: 'residentialSouth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'residentialSouthGreen',
                'residentialSouthYellow',
                'residentialSouthRed',
              ],
            },
          },
          {
            id: 'residentialSouthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'residentialSouth',
            type: 'boolean',
          },
          {
            id: 'residentialSouthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'residentialSouth',
            type: 'boolean',
          },
          {
            id: 'residentialSouthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'residentialSouth',
            type: 'boolean',
          },
          {
            id: 'residentialEast',
            name: 'East - Residential',
            required: false,
            display: false,
            groupingId: 'residentialEast',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'residentialEastGreen',
                'residentialEastYellow',
                'residentialEastRed',
              ],
            },
          },
          {
            id: 'residentialEastGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'residentialEast',
            type: 'boolean',
          },
          {
            id: 'residentialEastYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'residentialEast',
            type: 'boolean',
          },
          {
            id: 'residentialEastRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'residentialEast',
            type: 'boolean',
          },
          {
            id: 'residentialWest',
            name: 'West - Residential',
            required: false,
            display: false,
            groupingId: 'residentialWest',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'residentialWestGreen',
                'residentialWestYellow',
                'residentialWestRed',
              ],
            },
          },
          {
            id: 'residentialWestGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'residentialWest',
            type: 'boolean',
          },
          {
            id: 'residentialWestYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'residentialWest',
            type: 'boolean',
          },
          {
            id: 'residentialWestRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'residentialWest',
            type: 'boolean',
          },
          {
            id: 'military',
            name: 'Military',
            required: false,
            display: true,
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'militaryNorth',
                'militarySouth',
                'militaryEast',
                'militaryWest',
              ],
            },
          },
          {
            id: 'militaryNorth',
            name: 'North - Military',
            required: false,
            display: false,
            groupingId: 'militaryNorth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'militaryNorthGreen',
                'militaryNorthYellow',
                'militaryNorthRed',
              ],
            },
          },
          {
            id: 'militaryNorthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'militaryNorth',
            type: 'boolean',
          },
          {
            id: 'militaryNorthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'militaryNorth',
            type: 'boolean',
          },
          {
            id: 'militaryNorthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'militaryNorth',
            type: 'boolean',
          },
          {
            id: 'militarySouth',
            name: 'South - Military',
            required: false,
            display: false,
            groupingId: 'militarySouth',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'militarySouthGreen',
                'militarySouthYellow',
                'militarySouthRed',
              ],
            },
          },
          {
            id: 'militarySouthGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'militarySouth',
            type: 'boolean',
          },
          {
            id: 'militarySouthYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'militarySouth',
            type: 'boolean',
          },
          {
            id: 'militarySouthRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'militarySouth',
            type: 'boolean',
          },
          {
            id: 'militaryEast',
            name: 'East - Military',
            required: false,
            display: false,
            groupingId: 'militaryEast',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'militaryEastGreen',
                'militaryEastYellow',
                'militaryEastRed',
              ],
            },
          },
          {
            id: 'militaryEastGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'militaryEast',
            type: 'boolean',
          },
          {
            id: 'militaryEastYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'militaryEast',
            type: 'boolean',
          },
          {
            id: 'militaryEastRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'militaryEast',
            type: 'boolean',
          },
          {
            id: 'militaryWest',
            name: 'West - Military',
            required: false,
            display: false,
            groupingId: 'militaryWest',
            type: 'boolean',
            optionalParams: {
              dependencies: [
                'militaryWestGreen',
                'militaryWestYellow',
                'militaryWestRed',
              ],
            },
          },
          {
            id: 'militaryWestGreen',
            name: 'Green',
            required: false,
            display: false,
            groupingId: 'militaryWest',
            type: 'boolean',
          },
          {
            id: 'militaryWestYellow',
            name: 'Yellow',
            required: false,
            display: false,
            groupingId: 'militaryWest',
            type: 'boolean',
          },
          {
            id: 'militaryWestRed',
            name: 'Red',
            required: false,
            display: false,
            groupingId: 'militaryWest',
            type: 'boolean',
          },
        ],
      },
      {
        targetEnvironmentId: 'ranchoCucamonga',
        id: 'bank',
        name: 'Bank',
        description: 'The bank is a building found within Rancho Cucamonga.',
        script: affectBank,
        args: [
          {
            id: 'color',
            name: 'Color',
            required: true,
            display: true,
            type: 'dropdown',
            selected: undefined,
            options: [
              {
                id: 'blue',
                name: 'Blue',
              },
              {
                id: 'green',
                name: 'Green',
              },
              {
                id: 'off',
                name: 'Off',
              },
              {
                id: 'purple',
                name: 'Purple',
              },
              {
                id: 'red',
                name: 'Red',
              },
              {
                id: 'white',
                name: 'White',
              },
              {
                id: 'yellow',
                name: 'Yellow',
              },
            ],
          },
        ],
      },
    ],
  }),
]

/**
 * Prompt modal for creating a list of effects to apply to a target
 */
export default function Effects(props: TEffects): JSX.Element | null {
  /* -- PROPS -- */
  const { action } = props

  /* -- STATE -- */
  const [displayNewEffect, setDisplayNewEffect] = useState<boolean>(false)
  const [selectedEffect, setSelectedEffect] = useState<ClientEffect>(
    new ClientEffect(action, { id: generateHash() }),
  )
  const [clearForms, setClearForms] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The class name for the add button.
   */
  const addButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton']

    // If the target environments are displayed then hide the add button.
    if (displayNewEffect) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /**
   * The class name for the cancel button.
   */
  const cancelButtonClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['FormButton']

    // If the target environments are not displayed then hide the cancel button.
    if (!displayNewEffect) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })

  /* -- EFFECTS -- */
  useEffect(() => {
    if (clearForms) {
      setDisplayNewEffect(false)
      setSelectedEffect(new ClientEffect(action, { id: generateHash() }))
      setClearForms(false)
    }
  }, [clearForms])

  /* -- RENDER -- */

  if (action.effects.length > 0) {
    return (
      <div className='Effects'>
        <h3>Current Effects:</h3>
        <div className='EffectsList'>
          {action.effects.map((effect: ClientEffect) => {
            return (
              <div
                className='Effect'
                key={`effect-${effect.id}`}
                onClick={() => setSelectedEffect(effect)}
              >
                {effect.name}
                <Tooltip description={effect.description} />
              </div>
            )
          })}
        </div>
        <Effect
          action={action}
          effect={selectedEffect}
          targetEnvironments={targetEnvironments}
          display={displayNewEffect}
          clearForm={clearForms}
        />
        <div className='ButtonContainer'>
          <div className={addButtonClassName}>
            <span className='Text' onClick={() => setDisplayNewEffect(true)}>
              <span className='LeftBracket'>[</span> Add Effect{' '}
              <span className='RightBracket'>]</span>
              <Tooltip
                description={
                  `* Click to add target effects and link them to this action.\n` +
                  `* **Note:** Target effects only happen when an action is successfully executed.`
                }
              />
            </span>
          </div>
          <div className={cancelButtonClassName}>
            <span className='Text' onClick={() => setClearForms(true)}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else if (action.effects.length === 0) {
    return (
      <div className='Effects'>
        <h3>Current Effects:</h3>
        <div className='EffectsList'>
          <div className='NoEffects'>No Effects...</div>
        </div>
        <Effect
          action={action}
          effect={selectedEffect}
          targetEnvironments={targetEnvironments}
          display={displayNewEffect}
          clearForm={clearForms}
        />
        <div className='ButtonContainer'>
          <div className={addButtonClassName}>
            <span className='Text' onClick={() => setDisplayNewEffect(true)}>
              <span className='LeftBracket'>[</span> Add Effect{' '}
              <span className='RightBracket'>]</span>
              <Tooltip
                description={
                  `* Click to add target effects and link them to this action.\n` +
                  `* **Note:** Target effects only happen when an action is successfully executed.`
                }
              />
            </span>
          </div>
          <div className={cancelButtonClassName}>
            <span className='Text' onClick={() => setClearForms(true)}>
              <span className='LeftBracket'>[</span> Cancel{' '}
              <span className='RightBracket'>]</span>
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR EFFECTS ---------------------------- */

/**
 * Props for Effects component.
 */
export type TEffects = {
  /**
   * The mission-action the effects belong to.
   */
  action: ClientMissionAction
}
