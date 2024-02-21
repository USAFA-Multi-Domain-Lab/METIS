import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { TTargetArg } from '../../../../../../shared/target-environments/targets'
import { AnyObject } from '../../../../../../shared/toolbox/objects'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../../form/Form'
import './ArgGroupings.scss'

/**
 * Renders all the argument fields for a grouping of arguments.
 */
export default function ArgGroupings({
  effect,
  grouping,
  dropDownKey,
  numberKey,
  stringKey,
  mediumStringKey,
  booleanKey,
  defaultDropDownValue,
  defaultNumberValue,
  defaultStringValue,
  defaultBooleanValue,
  effectArgs,
  reqPropertiesNotFilledOut,
  updateArg,
}: TArgGroupings_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  const [isExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * Boolean to determine if at least one argument
   * in the grouping is displayed.
   */
  const oneGroupingIsDisplayed: boolean = compute(() => {
    // Set the default boolean to false.
    let oneGroupingIsDisplayed: boolean = false

    // Iterate through the grouping.
    grouping.forEach((arg: TTargetArg) => {
      // If the argument is displayed then set the
      // boolean to true.
      if (arg.display) {
        oneGroupingIsDisplayed = true
      }
    })

    return oneGroupingIsDisplayed
  })
  /**
   * Class name for the grouping.
   */
  const groupingClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Grouping']

    // If no arguments in the grouping are displayed
    // then hide the grouping.
    if (!oneGroupingIsDisplayed) {
      classList.push('Hidden')
    }

    return classList.join(' ')
  })

  /* -- RENDER -- */
  if (grouping.length > 0) {
    return (
      <div className={groupingClassName}>
        {grouping.map((arg: TTargetArg) => {
          /* -- COMPUTED -- */
          /**
           * Dynamic class name for the argument field.
           */
          const argFieldClassName: string = compute(() => {
            // Create a default list of class names.
            let classList: string[] = ['ArgField']

            // If the argument is not displayed then hide it.
            if (!arg.display) {
              classList.push('Hidden')
            }

            return classList.join(' ')
          })
          const dropDownValue: TTargetArgDropdownOption | undefined = compute(
            () => {
              let value: TTargetArgDropdownOption | undefined = undefined

              if (arg.type === 'dropdown') {
                if (effectArgs[arg.id]) {
                  value = arg.options.find(
                    (option: TTargetArgDropdownOption) =>
                      option.id === effectArgs[arg.id],
                  )
                } else if (
                  effectArgs[arg.id] === undefined &&
                  effect.args[arg.id]
                ) {
                  value = arg.options.find(
                    (option: TTargetArgDropdownOption) =>
                      option.id === effect.args[arg.id],
                  )
                }
              }

              return value
            },
          )

          // If the argument type is "dropdown" and it is required
          // then render the dropdown.
          if (arg.type === 'dropdown') {
            return (
              <div
                className={`${argFieldClassName} Dropdown`}
                key={`arg-${arg.id}_type-${arg.type}-container_${dropDownKey}`}
              >
                <DetailDropDown<TTargetArgDropdownOption>
                  label={arg.name}
                  options={arg.options}
                  currentValue={
                    dropDownValue || arg.default || defaultDropDownValue
                  }
                  isExpanded={isExpanded}
                  uniqueDropDownStyling={{}}
                  uniqueOptionStyling={(option: TTargetArgDropdownOption) => {
                    return {}
                  }}
                  renderOptionClassName={(option: TTargetArgDropdownOption) =>
                    option.name
                  }
                  renderDisplayName={(option: TTargetArgDropdownOption) =>
                    option.name
                  }
                  deliverValue={(option: TTargetArgDropdownOption) => {
                    // Add the argument to the list of arguments.
                    effectArgs[arg.id] = option.id
                    // Remove the argument ID from the list of
                    // arguments that are not filled out.
                    updateArg(arg)

                    // If the option is the default option
                    // then the argument is not filled out.
                    if (
                      option === arg.default ||
                      option === defaultDropDownValue
                    ) {
                      // Reset the argument to the default option.
                      effectArgs[arg.id] =
                        arg.default?.id || defaultDropDownValue
                      // Add the argument ID to the list of
                      // arguments that are not filled out.
                      // (This disables the save button.)
                      reqPropertiesNotFilledOut.push(arg.id)
                    }

                    // Display the changes.
                    forceUpdate()
                  }}
                  key={`arg-${arg.id}_type-${arg.type}_field-${dropDownKey}`}
                />
              </div>
            )
          }
          // If the argument type is "number" and it is required
          // then render the number input.
          else if (arg.type === 'number') {
            return (
              <div
                className={`${argFieldClassName} Number`}
                key={`arg-${arg.id}_type-${arg.type}-container_${numberKey}`}
              >
                <DetailNumber
                  label={arg.name}
                  initialValue={
                    effect.args[arg.id] || arg.default || defaultNumberValue
                  }
                  deliverValue={(value: number | null | undefined) => {
                    // Add the argument to the list of arguments.
                    effectArgs[arg.id] = value

                    // Remove the argument ID from the list of
                    // arguments that are not filled out.
                    updateArg(arg)

                    // If the value is null or undefined then the
                    // argument is not filled out.
                    if (
                      value === arg.default ||
                      value === defaultNumberValue ||
                      value === null ||
                      value === undefined
                    ) {
                      // Reset the argument to the default value.
                      effectArgs[arg.id] = arg.default || defaultNumberValue
                      // Add the argument ID to the list of
                      // arguments that are not filled out.
                      // (This disables the save button.)
                      reqPropertiesNotFilledOut.push(arg.id)
                    }

                    // Display the changes.
                    forceUpdate()
                  }}
                  options={{
                    minimum: arg.min,
                    maximum: arg.max,
                    unit: arg.unit,
                    emptyValueAllowed: true,
                    placeholder: arg.required ? 'Required' : 'Optional',
                  }}
                  key={`arg-${arg.id}_type-${arg.type}_field-${numberKey}`}
                />
              </div>
            )
          }
          // If the argument type is "string" and it is required
          // then render the string input.
          else if (arg.type === 'string') {
            return (
              <div
                className={`${argFieldClassName} String`}
                key={`arg-${arg.id}_type-${arg.type}-container_${stringKey}`}
              >
                <Detail
                  label={arg.name}
                  initialValue={
                    effect.args[arg.id] || arg.default || defaultStringValue
                  }
                  deliverValue={(value: string) => {
                    // Add the argument to the list of arguments.
                    effectArgs[arg.id] = value
                    // Update the argument's properties and its
                    // dependencies.
                    updateArg(arg)

                    // If the value is empty then the argument
                    // is not filled out.
                    if (value === arg.default || value === defaultStringValue) {
                      // Reset the argument to the default value.
                      effectArgs[arg.id] = arg.default || defaultStringValue
                      // Add the argument ID to the list of
                      // arguments that are not filled out.
                      // (This disables the save button.)
                      reqPropertiesNotFilledOut.push(arg.id)
                    }

                    // Display the changes.
                    forceUpdate()
                  }}
                  options={{
                    placeholder: arg.required ? 'Required' : 'Optional',
                  }}
                  key={`arg-${arg.id}_type-${arg.type}_field-${stringKey}`}
                />
              </div>
            )
          }
          // If the argument type is "medium-string" and it is required
          // then render the medium-string input.
          else if (arg.type === 'medium-string') {
            return (
              <div
                className={`${argFieldClassName} MediumString`}
                key={`arg-${arg.id}_type-${arg.type}-container_${mediumStringKey}`}
              >
                <DetailBox
                  label={arg.name}
                  initialValue={
                    effect.args[arg.id] || arg.default || defaultStringValue
                  }
                  deliverValue={(value: string) => {
                    // Add the argument to the list of arguments.
                    effectArgs[arg.id] = value
                    // Remove the argument ID from the list of
                    // arguments that are not filled out.
                    updateArg(arg)

                    // If the value is empty then the argument
                    // is not filled out.
                    if (value === arg.default || value === defaultStringValue) {
                      // Reset the argument to the default value.
                      effectArgs[arg.id] = arg.default || defaultStringValue
                      // Add the argument ID to the list of
                      // arguments that are not filled out.
                      // (This disables the save button.)
                      reqPropertiesNotFilledOut.push(arg.id)
                    }

                    // Display the changes.
                    forceUpdate()
                  }}
                  options={{
                    emptyStringAllowed: arg.required,
                    placeholder: arg.required ? 'Required' : 'Optional',
                    elementBoundary: '.BorderBox',
                  }}
                  key={`arg-${arg.id}_type-${arg.type}_field-${mediumStringKey}`}
                />
              </div>
            )
          }
          // If the argument type is "boolean" and it is required
          // then render the boolean toggle.
          else if (arg.type === 'boolean') {
            return (
              <div
                className={`${argFieldClassName} Boolean`}
                key={`arg-${arg.id}_type-${arg.type}-container_${booleanKey}`}
              >
                <DetailToggle
                  label={arg.name}
                  initialValue={
                    effect.args[arg.id] || arg.default || defaultBooleanValue
                  }
                  deliverValue={(value: boolean) => {
                    // Add the argument to the list of arguments.
                    effectArgs[arg.id] = value
                    // Remove the argument ID from the list of
                    // arguments that are not filled out.
                    updateArg(arg)
                    // Display the changes.
                    forceUpdate()
                  }}
                  key={`arg-${arg.id}_type-${arg.type}_field-${booleanKey}`}
                />
              </div>
            )
          }
        })}
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG GROUPINGS ---------------------------- */

/**
 * The dropdown argument type for a target.
 */
export type TTargetArgDropdownOption = {
  /**
   * The ID of the option.
   */
  id: string
  /**
   * The name of the option.
   */
  name: string
}

/**
 * The props for the ArgGroupings component.
 */
export type TArgGroupings_P = {
  /**
   * The effect to which the arguments belong.
   */
  effect: ClientEffect
  /**
   * The grouping of arguments to display.
   */
  grouping: TTargetArg[]
  /**
   * The key for the dropdown field.
   */
  dropDownKey: string
  /**
   * The key for the number field.
   */
  numberKey: string
  /**
   * The key for the string field.
   */
  stringKey: string
  /**
   * The key for the medium string field.
   */
  mediumStringKey: string
  /**
   * The key for the boolean field.
   */
  booleanKey: string
  /**
   * The default value for the dropdown argument.
   */
  defaultDropDownValue: undefined
  /**
   * The default value for the number argument.
   */
  defaultNumberValue: null
  /**
   * The default value for the string argument.
   */
  defaultStringValue: string
  /**
   * The default value for the boolean argument.
   */
  defaultBooleanValue: boolean
  /**
   * The arguments that are stored in the state component.
   */
  effectArgs: AnyObject
  /**
   * The list of required properties that are not filled out.
   */
  reqPropertiesNotFilledOut: string[]
  /**
   * The function to update the argument properties and its dependencies.
   */
  updateArg: (arg: TTargetArg) => void
}
