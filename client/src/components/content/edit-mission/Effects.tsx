import { useEffect, useState } from 'react'
import Tooltip from '../communication/Tooltip'
import './Effects.scss'
import {
  Detail,
  DetailBox,
  DetailDropDown,
  DetailNumber,
  DetailToggle,
} from '../form/Form'
import {
  AnyObject,
  SingleTypeObject,
} from '../../../../../shared/toolbox/objects'
import { useGlobalContext } from 'src/context'
import { v4 as generateHash } from 'uuid'

/**
 * Prompt modal for creating a list of effects to apply to a target
 */
export default function Effects(props: TEffects): JSX.Element | null {
  /* -- PROPS -- */
  let { targetEnvironments, isOpen, handleCloseRequest } = props

  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- COMPONENT STATE -- */
  const [isExpanded] = useState<boolean>(false)
  const [defaultBooleanValue] = useState<boolean>(false)
  const [defaultNumberValue] = useState<null>(null)
  const [defaultStringValue] = useState<string>('')
  const [defaultDropDownValue] = useState<AnyObject>({
    id: 'default',
    name: 'Select an option',
  })
  const [clearForm, setClearForm] = useState<boolean>(false)
  const [dropdownFormKey, setDropdownFormKey] = useState<string>(
    `arg-form-dropdown_${generateHash()}`,
  )
  const [numberFormKey, setNumberFormKey] = useState<string>(
    `arg-form-number_${generateHash()}`,
  )
  const [stringFormKey, setStringFormKey] = useState<string>(
    `arg-form-string_${generateHash()}`,
  )
  const [mediumStringFormKey, setMediumStringFormKey] = useState<string>(
    `arg-form-medium-string_${generateHash()}`,
  )
  const [booleanFormKey, setBooleanFormKey] = useState<string>(
    `arg-form-boolean_${generateHash()}`,
  )
  const [effectArgs, setEffectArgs] = useState<AnyObject>({})

  // todo: remove
  const [effect] = useState<{
    targetEnvironment: any | null
    selectedTarget: any | null
    args: AnyObject
    reqPropertiesNotFilledOut: string[]
  }>({
    targetEnvironment: null,
    selectedTarget: null,
    args: {},
    reqPropertiesNotFilledOut: [],
  })

  /* -- COMPONENT EFFECTS -- */
  useEffect(() => {
    if (clearForm) {
      // Reset the arguments that is stored in the effect.
      effect.args = {}
      setEffectArgs({})

      // Iterate through the selected target's arguments.
      effect.selectedTarget?.args.forEach((arg: any) => {
        // If the argument is a dropdown then reset its
        // selected option to the default option.
        if (arg.type === 'dropdown') {
          arg.selected = defaultDropDownValue
        }

        // Update the argument's properties and its
        // dependencies.
        updateArg(arg)
      })

      // Update the form keys so that the forms will re-render.
      setDropdownFormKey(`arg-form-dropdown_${generateHash()}`)
      setNumberFormKey(`arg-form-number_${generateHash()}`)
      setStringFormKey(`arg-form-string_${generateHash()}`)
      setMediumStringFormKey(`arg-form-medium-string_${generateHash()}`)
      setBooleanFormKey(`arg-form-boolean_${generateHash()}`)

      // After the form has been cleared then
      // set clearForm to false.
      setClearForm(false)
    }
  }, [clearForm])

  // todo: remove
  useEffect(() => {
    // If the modal is not open then reset the
    // the selected target, the target environment,
    // and the form.
    if (!isOpen) {
      // Reset the arguments that is stored in the effect.
      effect.args = {}
      setEffectArgs({})

      // Iterate through the selected target's arguments.
      effect.selectedTarget?.args.forEach((arg: any) => {
        // If the argument is a dropdown then reset its
        // selected option to the default option.
        if (arg.type === 'dropdown') {
          arg.selected = defaultDropDownValue
        }

        // Update the argument's properties and its
        // dependencies.
        updateArg(arg)
      })

      // Update the form keys so that the forms will re-render.
      setDropdownFormKey(`arg-form-dropdown_${generateHash()}`)
      setNumberFormKey(`arg-form-number_${generateHash()}`)
      setStringFormKey(`arg-form-string_${generateHash()}`)
      setMediumStringFormKey(`arg-form-medium-string_${generateHash()}`)
      setBooleanFormKey(`arg-form-boolean_${generateHash()}`)

      // Reset the selected target environment.
      if (effect.targetEnvironment !== null) {
        effect.targetEnvironment = null
      }
      // Reset the selected target.
      if (effect.selectedTarget !== null) {
        effect.selectedTarget = null
      }
      // Reset the list of arguments that are not filled out.
      effect.reqPropertiesNotFilledOut = []
    }
  }, [isOpen])

  /* -- COMPONENT FUNCTIONS -- */

  // -- Target Environments --

  /**
   * Renders the list of target environments.
   */
  const renderTargetEnvironments = (): JSX.Element | null => {
    /* -- RENDER -- */
    if (effect.targetEnvironment === null) {
      return (
        <div className='TargetEnvironments'>
          <h3>Select a Target Environment:</h3>
          <div className='TargetEnvironmentsList'>
            {targetEnvironments.map((targetEnvironment: any) => {
              return (
                <div
                  className='TargetEnvironment'
                  key={`target-environment-${targetEnvironment.id}`}
                  onClick={() => {
                    effect.targetEnvironment = targetEnvironment
                    forceUpdate()
                  }}
                >
                  {targetEnvironment.name}
                  <Tooltip description={targetEnvironment.description} />
                </div>
              )
            })}
          </div>
        </div>
      )
    } else {
      return null
    }
  }

  // -- Targets --

  /**
   * Renders the list of targets for the selected target environment.
   */
  const renderTargets = (): JSX.Element | null => {
    /* -- RENDER -- */
    if (effect.targetEnvironment && effect.selectedTarget === null) {
      return (
        <div className='Targets'>
          <h3>Targets:</h3>
          <div className='TargetsList'>
            {effect.targetEnvironment.targets.map((target: any) => {
              return (
                <div
                  className='Target'
                  onClick={() => {
                    // Set the selected target.
                    effect.selectedTarget = target
                    // Display the changes.
                    forceUpdate()
                  }}
                  key={`target-${target.id}`}
                >
                  {target.name}
                  <Tooltip description={target.description} />
                </div>
              )
            })}
          </div>
        </div>
      )
    } else if (effect.targetEnvironment && effect.selectedTarget) {
      return (
        <div className='Targets'>
          <h3>Selected Target:</h3>
          <div className='TargetsList'>
            <div className='Target Selected'>
              {effect.selectedTarget.name}
              <Tooltip description={effect.selectedTarget.description} />
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }

  // -- Arguments --

  /**
   * Recusive function that updates the argument's dependencies
   * depending on the argument's type and value.
   * @param arg The argument to update.
   * @param dependencies The list of dependencies.
   */
  const updateArgDependencies = (arg: any, dependencies: string[]) => {
    // Iterate through the dependencies.
    dependencies.forEach((dependency: string) => {
      // Grab the selected target's arguments.
      let dependencyArg = effect.selectedTarget.args.find(
        (arg: any) => arg.id === dependency,
      )

      if (dependencyArg) {
        // If the argument is a dropdown then continue.
        if (arg.type === 'dropdown') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultDropDownValue ||
            effect.args[arg.id] === undefined
          ) {
            dependencyArg.display = false
            delete effect.args[dependencyArg.id]
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a number then continue.
        else if (arg.type === 'number') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultNumberValue ||
            effect.args[arg.id] === undefined
          ) {
            dependencyArg.display = false
            delete effect.args[dependencyArg.id]
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a string then continue.
        else if (arg.type === 'string') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultStringValue ||
            effect.args[arg.id] === undefined
          ) {
            dependencyArg.display = false
            delete effect.args[dependencyArg.id]
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a medium-string then continue.
        else if (arg.type === 'medium-string') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultStringValue ||
            effect.args[arg.id] === undefined
          ) {
            dependencyArg.display = false
            delete effect.args[dependencyArg.id]
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }
        // If the argument is a boolean then continue.
        else if (arg.type === 'boolean') {
          // If the argument's value equals a default value
          // or the argument's value doesn't exist then
          // hide the dependency argument.
          if (
            effect.args[arg.id] === arg.default ||
            effect.args[arg.id] === defaultBooleanValue ||
            effect.args[arg.id] === undefined
          ) {
            dependencyArg.display = false
            delete effect.args[dependencyArg.id]
          }
          // Otherwise, display the dependency argument.
          else {
            dependencyArg.display = true
          }
        }

        if (dependencyArg.optionalParams?.dependencies) {
          // If the dependency argument has dependencies then
          // update the dependency argument's dependencies.
          updateArgDependencies(
            dependencyArg,
            dependencyArg.optionalParams.dependencies,
          )
        }
      }
    })
  }

  /**
   * Updates the argument's properties and its dependencies depending
   * on the argument's type and value.
   * @param arg The argument to update.
   */
  const updateArg = (arg: any) => {
    // Remove the argument ID from the list of
    // arguments that are not filled out.
    effect.reqPropertiesNotFilledOut.splice(
      effect.reqPropertiesNotFilledOut.indexOf(arg.id),
      1,
    )

    // If the argument has dependencies then
    // the dependencies are now required.
    if (arg.optionalParams?.dependencies) {
      updateArgDependencies(arg, arg.optionalParams.dependencies)
    }
  }

  /**
   * Renders the forms for the arguments of the selected target.
   */
  const renderArgs = (): JSX.Element | null => {
    // Grab the selected target and its arguments.
    let target: any | null = effect.selectedTarget
    let args: any[] = target?.args

    // Object to store the arguments in groupings.
    let groupings: SingleTypeObject<any[]> = {}

    /* -- PRE-RENDER PROCESSING -- */
    // Default class names
    let saveButtonClasses: string[] = ['Button']
    let clearFormButtonClasses: string[] = ['Button']

    // If there are required properties that are not filled out ||
    // If the effect has no arguments ||
    // If the selected target is null ||
    // If the target environment is null ||
    // If the selected target has no arguments
    // then disable the save and clear form buttons.
    if (
      effect.reqPropertiesNotFilledOut.length > 0 ||
      Object.entries(effect.args).length === 0 ||
      effect.selectedTarget === null ||
      effect.targetEnvironment === null ||
      effect.selectedTarget.args.length === 0
    ) {
      // Disable the save button.
      saveButtonClasses.push('Disabled')
      // Disable the clear form button.
      clearFormButtonClasses.push('Disabled')
    }

    // If a target is selected and it has arguments
    // then group the arguments.
    if (target && args.length > 0) {
      // Iterate through the arguments.
      args.forEach((arg: any) => {
        // If the argument has a grouping ID then
        // continue.
        if (arg.groupingId) {
          let groupingId: string = arg.groupingId

          // If there is no grouping array for the grouping
          // then create one.
          if (!(groupingId in groupings)) {
            // Create a new grouping array.
            groupings[groupingId] = []
          }

          // Add the argument to the grouping array.
          groupings[groupingId].push(arg)
        }
        // Otherwise, the argument is not a part of a
        // grouping so it will be displayed as an
        // individual argument.
        else {
          groupings[arg.id] = [arg]
        }
      })
    }

    // Convert the groupings object to an array.
    let groupingEntries: any[] = Object.entries(groupings)

    /* -- RENDER -- */
    // If a target is selected and it has arguments
    // then render the arguments.
    if (groupingEntries.length > 0) {
      return (
        <div className='Args'>
          {/* -- ARGUMENT FORM -- */}
          <form
            className='ArgsForm'
            onSubmit={(e) => {
              e.preventDefault()
              setClearForm(true)
            }}
          >
            <h3>Arguments:</h3>
            <p className='AsteriskInfo'>
              <sup>*</sup> indicates required argument
            </p>

            {/* -- GROUPINGS -- */}
            {groupingEntries.map(([groupingId, grouping]) => {
              /* -- PRE-RENDER PROCESSING -- */

              // Default class names
              let groupingClasses: string[] = ['Grouping']

              // Boolean to determine if at least one argument
              // in the grouping is displayed.
              let oneGroupingIsDisplayed: boolean = false

              // Iterate through the grouping.
              grouping.forEach((arg: any) => {
                // If the argument is displayed then set the
                // boolean to true.
                if (arg.display) {
                  oneGroupingIsDisplayed = true
                }
              })

              // If no arguments in the grouping are displayed
              // then hide the grouping.
              if (!oneGroupingIsDisplayed) {
                groupingClasses.push('Hidden')
              }

              /* -- RENDER -- */
              if (grouping.length > 0) {
                return (
                  <div
                    className={groupingClasses.join(' ')}
                    key={`grouping-${groupingId}`}
                  >
                    {grouping.map((arg: any) => {
                      // Default class names
                      let argFieldClasses: string[] = ['ArgField']

                      // If the argument is not displayed then hide it.
                      if (!arg.display) {
                        argFieldClasses.push('Hidden')

                        if (arg.type === 'dropdown') {
                          // If the argument is a dropdown then reset its
                          // selected option to the default option.
                          arg.selected = defaultDropDownValue
                        }
                      }

                      // If the argument is required and it is not filled out
                      // then disable the save button.
                      if (arg.required && effect.args[arg.id] === undefined) {
                        saveButtonClasses.push('Disabled')
                      }

                      // todo: update
                      // if (effectArgs[arg.id] === undefined) {
                      //   if (arg.type === 'dropdown') {
                      //     setEffectArgs((prev) => {
                      //       return {
                      //         ...prev,
                      //         [arg.id]: arg.default || defaultDropDownValue,
                      //       }
                      //     })
                      //   } else if (arg.type === 'number') {
                      //     setEffectArgs((prev) => {
                      //       return {
                      //         ...prev,
                      //         [arg.id]: arg.default || defaultNumberValue,
                      //       }
                      //     })
                      //   } else if (arg.type === 'string') {
                      //     setEffectArgs((prev) => {
                      //       return {
                      //         ...prev,
                      //         [arg.id]: arg.default || defaultStringValue,
                      //       }
                      //     })
                      //   } else if (arg.type === 'medium-string') {
                      //     setEffectArgs((prev) => {
                      //       return {
                      //         ...prev,
                      //         [arg.id]: arg.default || defaultStringValue,
                      //       }
                      //     })
                      //   } else if (arg.type === 'boolean') {
                      //     setEffectArgs((prev) => {
                      //       return {
                      //         ...prev,
                      //         [arg.id]: arg.default || defaultBooleanValue,
                      //       }
                      //     })
                      //   }
                      // }

                      // If the argument type is "dropdown" and it is required
                      // then render the dropdown.
                      if (arg.type === 'dropdown') {
                        return (
                          <div
                            className={`${argFieldClasses.join(' ')} Dropdown`}
                            key={`arg-${arg.id}_form-${arg.type}_type-${arg.type}-container`}
                          >
                            <DetailDropDown<AnyObject>
                              label={arg.name}
                              options={arg.options}
                              currentValue={
                                arg.default ||
                                arg.selected ||
                                defaultDropDownValue
                              }
                              isExpanded={isExpanded}
                              uniqueDropDownStyling={{}}
                              uniqueOptionStyling={(option: AnyObject) => {
                                return {}
                              }}
                              renderOptionClassName={(option: AnyObject) =>
                                option.name
                              }
                              renderDisplayName={(option: AnyObject) =>
                                option.name
                              }
                              deliverValue={(option: AnyObject) => {
                                // Set the selected option.
                                arg.selected = option
                                // Add the argument to the list of arguments.
                                effect.args[arg.id] = option.id
                                // Remove the argument ID from the list of
                                // arguments that are not filled out.
                                updateArg(arg)

                                // If the option is the default option
                                // then the argument is not filled out.
                                if (option === defaultDropDownValue) {
                                  // Remove the argument from the list of arguments
                                  // that are used to save the effect.
                                  delete effect.args[arg.id]
                                  // Add the argument ID to the list of
                                  // arguments that are not filled out.
                                  // (This disables the save button.)
                                  effect.reqPropertiesNotFilledOut.push(arg.id)
                                }

                                // Display the changes.
                                forceUpdate()
                              }}
                              optional={{
                                displayRequiredIcon: arg.required,
                              }}
                              key={dropdownFormKey}
                            />
                          </div>
                        )
                      }
                      // If the argument type is "number" and it is required
                      // then render the number input.
                      else if (arg.type === 'number') {
                        return (
                          <div
                            className={`${argFieldClasses.join(' ')} Number`}
                            key={`arg-${arg.id}_form-${arg.type}_type-${arg.type}-container`}
                          >
                            <DetailNumber
                              label={arg.name}
                              initialValue={arg.default || defaultNumberValue}
                              deliverValue={(
                                value: number | null | undefined,
                              ) => {
                                // Add the argument to the list of arguments.
                                effect.args[arg.id] = value

                                // Remove the argument ID from the list of
                                // arguments that are not filled out.
                                updateArg(arg)

                                // If the value is null or undefined then the
                                // argument is not filled out.
                                if (
                                  value === null ||
                                  value === undefined ||
                                  value === defaultNumberValue
                                ) {
                                  // Remove the argument from the list of arguments
                                  // that are used to save the effect.
                                  delete effect.args[arg.id]
                                  // Add the argument ID to the list of
                                  // arguments that are not filled out.
                                  // (This disables the save button.)
                                  effect.reqPropertiesNotFilledOut.push(arg.id)
                                }

                                // Display the changes.
                                forceUpdate()
                              }}
                              options={{
                                minimum: arg.min,
                                maximum: arg.max,
                                unit: arg.unit,
                                emptyValueAllowed: true,
                                displayRequiredIcon: arg.required,
                              }}
                              key={numberFormKey}
                            />
                          </div>
                        )
                      }
                      // If the argument type is "string" and it is required
                      // then render the string input.
                      else if (arg.type === 'string') {
                        return (
                          <div
                            className={`${argFieldClasses.join(' ')} String`}
                            key={`arg-${arg.id}_form-${arg.type}_type-${arg.type}-container`}
                          >
                            <Detail
                              label={arg.name}
                              initialValue={arg.default || defaultStringValue}
                              deliverValue={(value: string) => {
                                // Add the argument to the list of arguments.
                                effect.args[arg.id] = value
                                // Update the argument's properties and its
                                // dependencies.
                                updateArg(arg)

                                // If the value is empty then the argument
                                // is not filled out.
                                if (
                                  value === '' ||
                                  value === defaultStringValue
                                ) {
                                  // Remove the argument from the list of arguments
                                  // that are used to save the effect.
                                  delete effect.args[arg.id]
                                  // Add the argument ID to the list of
                                  // arguments that are not filled out.
                                  // (This disables the save button.)
                                  effect.reqPropertiesNotFilledOut.push(arg.id)
                                }

                                // Display the changes.
                                forceUpdate()
                              }}
                              options={{
                                displayRequiredIcon: arg.required,
                              }}
                              key={stringFormKey}
                            />
                          </div>
                        )
                      }
                      // If the argument type is "medium-string" and it is required
                      // then render the medium-string input.
                      else if (arg.type === 'medium-string') {
                        return (
                          <div
                            className={`${argFieldClasses.join(
                              ' ',
                            )} MediumString`}
                            key={`arg-${arg.id}_form-${arg.type}_type-${arg.type}-container`}
                          >
                            <DetailBox
                              label={arg.name}
                              initialValue={arg.default || defaultStringValue}
                              deliverValue={(value: string) => {
                                // Add the argument to the list of arguments.
                                effect.args[arg.id] = value
                                // Remove the argument ID from the list of
                                // arguments that are not filled out.
                                updateArg(arg)

                                // If the value is empty then the argument
                                // is not filled out.
                                if (
                                  value === '' ||
                                  value === defaultStringValue
                                ) {
                                  // Remove the argument from the list of arguments
                                  // that are used to save the effect.
                                  delete effect.args[arg.id]
                                  // Add the argument ID to the list of
                                  // arguments that are not filled out.
                                  // (This disables the save button.)
                                  effect.reqPropertiesNotFilledOut.push(arg.id)
                                }

                                // Display the changes.
                                forceUpdate()
                              }}
                              options={{
                                emptyStringAllowed: true,
                                displayRequiredIcon: arg.required,
                              }}
                              key={mediumStringFormKey}
                            />
                          </div>
                        )
                      }
                      // If the argument type is "boolean" and it is required
                      // then render the boolean toggle.
                      else if (arg.type === 'boolean') {
                        return (
                          <div
                            className={`${argFieldClasses.join(' ')} Boolean`}
                            key={`arg-${arg.id}_form-${arg.type}_type-${arg.type}-container`}
                          >
                            <DetailToggle
                              label={arg.name}
                              initialValue={arg.default || defaultBooleanValue}
                              deliverValue={(value: boolean) => {
                                // Add the argument to the list of arguments.
                                effect.args[arg.id] = value
                                // Remove the argument ID from the list of
                                // arguments that are not filled out.
                                updateArg(arg)
                                // Display the changes.
                                forceUpdate()
                              }}
                              options={{
                                displayRequiredIcon: arg.required,
                              }}
                              key={booleanFormKey}
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
            })}
          </form>
          {/* -- BUTTONS -- */}
          <div className='ButtonContainer'>
            <div
              className={clearFormButtonClasses.join(' ')}
              onClick={() => setClearForm(true)}
            >
              Clear Form
            </div>
            <div
              className={saveButtonClasses.join(' ')}
              onClick={() => {
                // todo: remove
                // console.log(effect.args)
                // Execute the effect.
                effect.selectedTarget.script(effect.args)
                setClearForm(true)
              }}
            >
              Create
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  // Default class names
  let className: string = 'Effects'

  // If the modal is not open then hide it.
  if (!isOpen) {
    className += ' Hidden'
  }

  /* -- RENDER -- */

  return (
    <div className={className}>
      <div className='Close'>
        <div className='CloseButton' onClick={handleCloseRequest}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <h2>Target Effects</h2>
      <div className='EffectsContent'>
        {renderTargetEnvironments()}
        {renderTargets()}
        {renderArgs()}

        {/* // todo: remove */}
        <div className='ButtonContainer'>
          <div
            className={effect.targetEnvironment ? 'Button' : 'Button Disabled'}
            onClick={() => {
              // Reset the arguments that is stored in the effect.
              effect.args = {}
              setEffectArgs({})

              // Iterate through the selected target's arguments.
              effect.selectedTarget?.args.forEach((arg: any) => {
                // If the argument is a dropdown then reset its
                // selected option to the default option.
                if (arg.type === 'dropdown') {
                  arg.selected = defaultDropDownValue
                }

                // Update the argument's properties and its
                // dependencies.
                updateArg(arg)
              })

              // Update the form keys so that the forms will re-render.
              setDropdownFormKey(`arg-form-dropdown_${generateHash()}`)
              setNumberFormKey(`arg-form-number_${generateHash()}`)
              setStringFormKey(`arg-form-string_${generateHash()}`)
              setMediumStringFormKey(`arg-form-medium-string_${generateHash()}`)
              setBooleanFormKey(`arg-form-boolean_${generateHash()}`)

              if (effect.targetEnvironment !== null) {
                effect.targetEnvironment = null
              }

              if (effect.selectedTarget !== null) {
                effect.selectedTarget = null
              }

              effect.reqPropertiesNotFilledOut = []
            }}
          >
            Refresh
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR EFFECTS ---------------------------- */

/**
 * Props for Effects component
 */
export type TEffects = {
  /**
   * List of targets to apply effects to.
   */
  targetEnvironments: any[]
  /**
   * Whether or not the modal is open.
   */
  isOpen: boolean
  /**
   * Callback function that handles the closing of the modal.
   */
  handleCloseRequest: () => void
}
