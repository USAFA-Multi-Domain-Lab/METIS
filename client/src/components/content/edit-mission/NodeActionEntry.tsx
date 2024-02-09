import { useState } from 'react'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import Tooltip from '../communication/Tooltip'
import { Detail, DetailBox, DetailNumber } from '../form/Form'
import NodeActionAssets from './NodeActionAssets'
import './NodeActionEntry.scss'
import Effects from './Effects'
import { AnyObject } from '../../../../../shared/toolbox/objects'

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

const targetEnvironments: any[] = [
  {
    id: 'ascot',
    name: 'ASCOT',
    description:
      'Advanced Simulation Combat Operations Trainer (ASCOT) is a high-fidelity environment generator designed for military instructors needing real-time, interactive, multi-platform simulation.',
    targets: [
      {
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
  },
  {
    id: 'ranchoCucamonga',
    name: 'Rancho Cucamonga',
    description:
      'Rancho Cucamonga is a scale model of a city used for educating students on network security.',
    targets: [
      {
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
  },
]

/**
 * This will render the entry fields for an action
 * as a part of the NodeActionDetails component.
 */
export default function NodeActionEntry(
  props: TNodeActionEntry,
): JSX.Element | null {
  let action: ClientMissionAction = props.action
  let node: ClientMissionNode = action.node
  let displayedAction: number = props.displayedAction
  let isEmptyString: boolean = props.isEmptyString
  let actionEmptyStringArray: string[] = props.actionEmptyStringArray
  let setDisplayedAction = props.setDisplayedAction
  let setActionEmptyStringArray = props.setActionEmptyStringArray
  let remount = props.remount
  let handleChange = props.handleChange
  let deleteActionClassName: string = 'FormButton DeleteAction'
  let nodeActionClassName: string = 'NodeActionEntry'

  /* -- COMPONENT STATE -- */
  const [deliverNameError, setDeliverNameError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>(
    'At least one character is required here.',
  )
  const [displayEffects, setDisplayEffects] = useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */
  const removeActionEmptyString = (field: string) => {
    actionEmptyStringArray.map((actionEmptyString: string, index: number) => {
      if (actionEmptyString === `actionID=${action.actionID}_field=${field}`) {
        actionEmptyStringArray.splice(index, 1)
      }
    })
  }

  const handleDeleteRequest = () => {
    node.actions.delete(action.actionID)
    setDisplayedAction(Math.max(displayedAction - 1, 0))
    setActionEmptyStringArray([])
    handleChange()
  }

  const toggleDisplayEffects = () => {
    setDisplayEffects(!displayEffects)
  }

  /* -- RENDER -- */

  if (node.actions.size === 1) {
    deleteActionClassName += ' Disabled'
    nodeActionClassName += ' DisableBottomBorder'
  }

  if (node.executable) {
    return (
      <div className={nodeActionClassName}>
        <Detail
          label='Name'
          initialValue={action.name}
          deliverValue={(name: string) => {
            if (name !== '') {
              action.name = name
              removeActionEmptyString('name')
              setDeliverNameError(false)
              remount()
              handleChange()
            } else {
              setDeliverNameError(true)
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=name`,
              ])
              remount()
            }
          }}
          options={{
            deliverError: deliverNameError,
            deliverErrorMessage: errorMessage,
          }}
          key={`${action.actionID}_name`}
        />
        <DetailBox
          label='Description'
          initialValue={action.description}
          deliverValue={(description: string) => {
            action.description = description

            // Equivalent to an empty string.
            if (description !== '<p><br></p>') {
              removeActionEmptyString('description')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=description`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_description`}
        />
        <DetailNumber
          label='Success Chance'
          initialValue={parseFloat(
            `${(action.successChance * 100.0).toFixed(2)}`,
          )}
          options={{
            minimum: 0,
            maximum: 100,
            unit: '%',
          }}
          deliverValue={(
            successChancePercentage: number | null | undefined,
          ) => {
            if (
              successChancePercentage !== null &&
              successChancePercentage !== undefined
            ) {
              action.successChance = successChancePercentage / 100.0

              handleChange()
            }
          }}
          key={`${action.actionID}_successChance`}
        />
        <DetailNumber
          label='Process Time'
          initialValue={action.processTime / 1000}
          options={{
            minimum: 0,
            maximum: 3600,
            unit: 's',
          }}
          deliverValue={(timeCost: number | null | undefined) => {
            if (timeCost !== null && timeCost !== undefined) {
              action.processTime = timeCost * 1000

              handleChange()
            }
          }}
          key={`${action.actionID}_timeCost`}
        />
        <DetailNumber
          label='Resource Cost'
          initialValue={action.resourceCost}
          deliverValue={(resourceCost: number | null | undefined) => {
            if (resourceCost !== null && resourceCost !== undefined) {
              action.resourceCost = resourceCost

              handleChange()
            }
          }}
          key={`${action.actionID}_resourceCost`}
        />
        <DetailBox
          label='Post-Execution Success Text'
          initialValue={action.postExecutionSuccessText}
          deliverValue={(postExecutionSuccessText: string) => {
            action.postExecutionSuccessText = postExecutionSuccessText

            // Equivalent to an empty string.
            if (postExecutionSuccessText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionSuccessText')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionSuccessText`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_postExecutionSuccessText`}
        />
        <DetailBox
          label='Post-Execution Failure Text'
          initialValue={action.postExecutionFailureText}
          deliverValue={(postExecutionFailureText: string) => {
            action.postExecutionFailureText = postExecutionFailureText

            // Equivalent to an empty string.
            if (postExecutionFailureText !== '<p><br></p>') {
              removeActionEmptyString('postExecutionFailureText')
              remount()
              handleChange()
            } else {
              setActionEmptyStringArray([
                ...actionEmptyStringArray,
                `actionID=${action.actionID}_field=postExecutionFailureText`,
              ])
              remount()
            }
          }}
          options={{
            elementBoundary: '.BorderBox',
          }}
          key={`${action.actionID}_postExecutionFailureText`}
        />
        <NodeActionAssets
          action={action}
          isEmptyString={isEmptyString}
          handleChange={handleChange}
        />
        <Effects
          targetEnvironments={targetEnvironments}
          isOpen={displayEffects}
          handleCloseRequest={toggleDisplayEffects}
        />
        <div className='ButtonContainer'>
          <div className='FormButton'>
            <span className='Text' onClick={toggleDisplayEffects}>
              <span className='LeftBracket'>[</span> Effects for "{action.name}"{' '}
              <span className='RightBracket'>]</span>
              <Tooltip
                description={
                  `* Click to add target effects and link them to this action.\n` +
                  `* **Note:** Target effects only happen when an action is successfully executed.`
                }
              />
            </span>
          </div>
          <div
            className={deleteActionClassName}
            key={`${action.actionID}_delete`}
          >
            <span className='Text' onClick={handleDeleteRequest}>
              <span className='LeftBracket'>[</span> Delete Action{' '}
              <span className='RightBracket'>]</span>
              <Tooltip description='Delete this action from the node.' />
            </span>
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR NODE ACTION ENTRY ---------------------------- */

/**
 * Props for NodeActionEntry component
 */
export type TNodeActionEntry = {
  /**
   * The mission-node-action to be edited.
   */
  action: ClientMissionAction
  /**
   * The current action being displayed. This is used for
   * pagination purposes.
   */
  displayedAction: number
  /**
   * A boolean that will be used to determine if a
   * field has been left empty.
   */
  isEmptyString: boolean
  /**
   * An array of strings that will be used to determine
   * if a field has been left empty.
   */
  actionEmptyStringArray: string[]
  /**
   * A function that will set the current action being
   * displayed.
   */
  setDisplayedAction: (displayedAction: number) => void
  /**
   * A function that will set the array of strings that
   * will be used to determine if a field has been left empty.
   */
  setActionEmptyStringArray: (actionEmptyStringArray: string[]) => void
  /**
   * Remounts the component.
   */
  remount: () => void
  /**
   * A function that will be called when a change has been made.
   */
  handleChange: () => void
}
