import { useEffect, useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import { ReactSetter } from 'src/toolbox/types'
import { TTargetArg } from '../../../../../../shared/target-environments/args'
import { TDropdownArgOption } from '../../../../../../shared/target-environments/args/dropdown-arg'
import ForceArg from '../../../../../../shared/target-environments/args/force-arg'
import {
  DetailDropdown,
  TOptionalHandleInvalidOption,
  TRequiredHandleInvalidOption,
} from '../../form/DetailDropdown'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import './ArgEntry.scss'

/**
 * Renders the argument field within a group of arguments.
 */
export default function ArgEntry({
  effect,
  effect: { mission },
  target,
  arg,
  effectArgs,
  setEffectArgs,
}: TArgGroupings_P): JSX.Element | null {
  /* -- STATE -- */
  const [defaultStringValue] = useState<''>('')
  const [defaultForce] = useState<ClientMissionForce>(effect.force)
  const [defaultNode] = useState<ClientMissionNode>(effect.node)
  const [dropDownValue, setDropDownValue] = useState<TDropdownArgOption>(() => {
    // If the argument is a dropdown and the argument's value
    // is in the effect's arguments then set the dropdown value.
    if (arg.type === 'dropdown' && arg.required) {
      // Grab the dropdown option.
      let option: TDropdownArgOption | undefined = arg.options.find(
        (option: TDropdownArgOption) => option._id === effectArgs[arg._id],
      )

      // If the option is found then set the dropdown value.
      if (option) {
        return option
      } else {
        return arg.default
      }
    } else {
      return {
        _id: 'temporary-option',
        name: 'Select an option',
      }
    }
  })
  const [optionalDropDownValue, setOptionalDropDownValue] =
    useState<TDropdownArgOption | null>(() => {
      // If the argument is a dropdown and the argument's value
      // is in the effect's arguments then set the dropdown value.
      if (arg.type === 'dropdown' && !arg.required) {
        // Grab the dropdown option.
        let option: TDropdownArgOption | undefined = arg.options.find(
          (option: TDropdownArgOption) => option._id === effectArgs[arg._id],
        )

        // If the option is found then set the dropdown value.
        if (option) {
          return option
        } else {
          return null
        }
      } else {
        return null
      }
    })
  const [numberValue, setNumberValue] = useState<number>(() => {
    // If the argument is a number and the argument's value
    // is in the effect's arguments then set the number value.
    if (arg.type === 'number' && arg.required) {
      return effectArgs[arg._id] ?? arg.default
    } else {
      return 0
    }
  })
  const [optionalNumberValue, setOptionalNumberValue] = useState<number | null>(
    effectArgs[arg._id] ?? null,
  )
  const [stringValue, setStringValue] = useState<string>(
    effectArgs[arg._id] ?? defaultStringValue,
  )
  const [largeStringValue, setLargeStringValue] = useState<string>(
    effectArgs[arg._id] ?? defaultStringValue,
  )
  const [booleanValue, setBooleanValue] = useState<boolean>(
    effectArgs[arg._id] ?? false,
  )
  const [forceValue, setForceValue] = useState<ClientMissionForce>(() => {
    if (arg.type === 'force' && arg.required) {
      return mission.getForce(effectArgs[arg._id]) ?? defaultForce
    } else if (arg.type === 'node' && arg.required) {
      return mission.getForce(effectArgs[ForceArg.ID]) ?? defaultForce
    } else {
      return defaultForce
    }
  })
  const [optionalForceValue, setOptionalForceValue] =
    useState<ClientMissionForce | null>(() => {
      if (arg.type === 'force' && !arg.required) {
        return mission.getForce(effectArgs[arg._id]) ?? null
      } else if (arg.type === 'node' && !arg.required) {
        return mission.getForce(effectArgs[ForceArg.ID]) ?? null
      } else {
        return null
      }
    })
  const [nodeValue, setNodeValue] = useState<ClientMissionNode>(
    mission.getNode(effectArgs[arg._id]) ?? defaultNode,
  )
  const [optionalNodeValue, setOptionalNodeValue] =
    useState<ClientMissionNode | null>(
      mission.getNode(effectArgs[arg._id]) ?? null,
    )
  const [requiredHandleInvalidNodeOption, setRequiredHandleInvalidNodeOption] =
    useState<TRequiredHandleInvalidOption<ClientMissionNode>>({
      method: 'warning',
    })
  const [optionalHandleInvalidNodeOption, setOptionalHandleInvalidNodeOption] =
    useState<TOptionalHandleInvalidOption<ClientMissionNode | null>>({
      method: 'warning',
    })

  /* -- COMPUTED -- */
  /**
   * Determines if all the argument's dependencies have been met.
   */
  const allDependenciesMet: boolean = compute(
    () => target?.allDependenciesMet(arg.dependencies, effectArgs) ?? false,
  )
  /**
   * The dropdown options that are available based on the
   * argument's dependencies.
   */
  const availableDropdownOptions: TDropdownArgOption[] = compute(() => {
    return arg.type === 'dropdown'
      ? arg.options.filter(
          (option) =>
            target?.allDependenciesMet(option.dependencies, effectArgs) ??
            false,
        )
      : []
  })

  /* -- EFFECTS -- */

  // Update the effect's arguments based on the status of
  // the argument's dependencies.
  useEffect(() => {
    // If all the dependencies have been met and the argument is
    // not in the effect's arguments then initialize the argument.
    if (allDependenciesMet && effectArgs[arg._id] === undefined) {
      initializeArg()
    }
    // Otherwise, remove the argument from the effect's arguments.
    else if (!allDependenciesMet && effectArgs[arg._id] !== undefined) {
      setEffectArgs((prev) => {
        delete prev[arg._id]
        return prev
      })
    }
  }, [allDependenciesMet])

  // Update the argument's value in the effect's arguments
  // when the argument's value changes.
  // *** Note: this doesn't execute on the first render. ***
  usePostInitEffect(() => {
    // If the argument is a drop down...
    if (arg.type === 'dropdown') {
      // ..and the argument's value is not in a default state
      // then update the dropdown value in the effect's
      // arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: dropDownValue._id }))
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional drop down value is not null
        // then update the optional drop down value in the
        // effect's arguments.
        if (optionalDropDownValue !== null) {
          setEffectArgs((prev) => ({
            ...prev,
            [arg._id]: optionalDropDownValue._id,
          }))
        }
        // Or, if the optional drop down value is null and
        // the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        else if (
          optionalDropDownValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
    // Or, if the argument is a number...
    else if (arg.type === 'number') {
      // ...and the argument is required, then update
      // the number value in the effect's arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: numberValue }))
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional number value is not null
        // then update the optional number value in the
        // effect's arguments.
        if (optionalNumberValue !== null) {
          setEffectArgs((prev) => ({ ...prev, [arg._id]: optionalNumberValue }))
        }
        // Or, if the optional number value is null and
        // the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        else if (
          optionalNumberValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
    // Or, if the argument is a string...
    else if (arg.type === 'string') {
      // ...and the argument's value is not in a default state
      // then update the string value in the effect's
      // arguments.
      if (stringValue !== defaultStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: stringValue }))
      }
    }
    // Or, if the argument is a large string...
    else if (arg.type === 'large-string') {
      // ...and the argument's value is not in a default state
      // then update the large string value in the effect's
      // arguments.
      if (largeStringValue !== defaultStringValue) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: largeStringValue }))
      }
    }
    // Or, if the argument is a boolean...
    else if (arg.type === 'boolean') {
      // ...then update the boolean value in the effect's arguments.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
    }
    // Or, if the argument is a force...
    else if (arg.type === 'force') {
      // ...and the argument's value is not in a default state
      // then update the force value in the effect's arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [arg._id]: forceValue._id }))
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional force value is not null
        // then update the optional force value in the
        // effect's arguments.
        if (optionalForceValue !== null) {
          setEffectArgs((prev) => ({
            ...prev,
            [arg._id]: optionalForceValue._id,
          }))
        }
        // Or, if the optional force value is null and
        // the argument is in the effect's arguments then
        // remove the argument from the effect's arguments.
        else if (
          optionalForceValue === null &&
          effectArgs[arg._id] !== undefined
        ) {
          setEffectArgs((prev) => {
            delete prev[arg._id]
            return prev
          })
        }
      }
    }
    // Or, if the argument is a node...
    else if (arg.type === 'node') {
      // ...and the argument's value is not in a default state
      // then update the node value and the force value in the
      // effect's arguments.
      if (arg.required) {
        setEffectArgs((prev) => ({ ...prev, [ForceArg.ID]: forceValue._id }))

        // If the node value is in the force's nodes then update
        // the node value in the effect's arguments.
        if (forceValue.nodes.includes(nodeValue)) {
          setEffectArgs((prev) => ({ ...prev, [arg._id]: nodeValue._id }))
        }
        // Otherwise, if the node value is not in the force's nodes
        // then set the node value to the first node in the force's
        // nodes.
        else {
          setRequiredHandleInvalidNodeOption({
            method: 'setToFirst',
          })
        }
      }
      // Or, if the argument is optional...
      else {
        // ...and the optional force value is null...
        if (optionalForceValue === null) {
          // ...and the force argument is in the effect's arguments
          // then remove the force argument from the effect's arguments.
          if (effectArgs[ForceArg.ID] !== undefined) {
            setEffectArgs((prev) => {
              delete prev[ForceArg.ID]
              return prev
            })
          }
          // Also, if the node argument is in the effect's arguments
          // then remove the node argument from the effect's arguments.
          if (effectArgs[arg._id] !== undefined) {
            setEffectArgs((prev) => {
              delete prev[arg._id]
              return prev
            })
          }
        }
        // Or, if the optional force value is not null...
        else {
          // ...then update the force value in the effect's arguments.
          setEffectArgs((prev) => ({
            ...prev,
            [ForceArg.ID]: optionalForceValue._id,
          }))

          // If the optional node value is not null and the node
          // value is in the force's nodes then update the node
          // value in the effect's arguments
          if (
            optionalNodeValue !== null &&
            optionalForceValue.nodes.includes(optionalNodeValue)
          ) {
            setEffectArgs((prev) => ({
              ...prev,
              [arg._id]: optionalNodeValue._id,
            }))
          }
          // Or, if the optional node value is not null and the node
          // value is not in the force's nodes then set the node value
          // to the first node in the force's nodes.
          else if (
            optionalNodeValue !== null &&
            !optionalForceValue.nodes.includes(optionalNodeValue)
          ) {
            setOptionalHandleInvalidNodeOption({
              method: 'setToFirst',
            })
          }
          // Or, if the optional node value is null and the argument
          // is in the effect's arguments then remove the argument
          // from the effect's arguments.
          else if (
            optionalNodeValue === null &&
            effectArgs[arg._id] !== undefined
          ) {
            setEffectArgs((prev) => {
              delete prev[arg._id]
              return prev
            })
          }
        }
      }
    }
  }, [
    dropDownValue,
    optionalDropDownValue,
    numberValue,
    optionalNumberValue,
    stringValue,
    largeStringValue,
    booleanValue,
    forceValue,
    optionalForceValue,
    nodeValue,
    optionalNodeValue,
  ])

  /* -- FUNCTIONS -- */

  /**
   * Initializes the argument within the effect's arguments.
   * @note *This is determined by the argument's dependencies
   * and whether the argument is required or not.*
   */
  const initializeArg = () => {
    // If the argument is required and all the dependencies
    // have been met...
    if (arg.required && allDependenciesMet) {
      // ...and the argument is a drop down then set the
      // drop down value to the default value.
      if (arg.type === 'dropdown') {
        // ...and the drop down value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (dropDownValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: dropDownValue._id }))
        }
        // Otherwise, set the drop down value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setDropDownValue(arg.default)
        }
      }
      // Or, if the argument is a number...
      else if (arg.type === 'number') {
        // ...and the number value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (numberValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: numberValue }))
        }
        // Otherwise, set the number value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setNumberValue(arg.default)
        }
      }
      // Or, if the argument is a string then set the string
      // value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else if (arg.type === 'string') {
        // ...and the string value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (stringValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: stringValue }))
        }
        // Otherwise, set the string value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setStringValue(arg.default)
        }
      }
      // Or, if the argument is a large string then set the
      // large string value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else if (arg.type === 'large-string') {
        // ...and the large string value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (largeStringValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: largeStringValue }))
        }
        // Otherwise, set the large string value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setLargeStringValue(arg.default)
        }
      }
      // Or, if the argument is a boolean...
      else if (arg.type === 'boolean') {
        // ...and the boolean value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (booleanValue === arg.default) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
        }
        // Otherwise, set the boolean value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setBooleanValue(arg.default)
        }
      }
      // Or, if the argument is a force then set the force
      // value to the default value.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else if (arg.type === 'force') {
        // ...and the force value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (forceValue === defaultForce) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: forceValue._id }))
        }
        // Otherwise, set the force value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setForceValue(defaultForce)
        }
      }
      // Or, if the argument is a node then set the force value
      // and the node value to their default values.
      // *** Note: The default value is mandatory if the
      // *** argument is required.
      else if (arg.type === 'node') {
        // ...and the force value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (forceValue === defaultForce) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [ForceArg.ID]: forceValue._id }))
        }
        // Otherwise, set the force value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setForceValue(defaultForce)
        }
        // ...and the node value stored in the state is the
        // same as the default value, then manually update the
        // effect's arguments by adding this argument and its
        // value.
        if (nodeValue === defaultNode) {
          // *** Note: An argument's value in the effect's
          // *** arguments is automatically set if the value
          // *** stored in this state changes. If the value
          // *** in the state doesn't change then the value
          // *** needs to be set manually.
          setEffectArgs((prev) => ({ ...prev, [arg._id]: nodeValue._id }))
        }
        // Otherwise, set the node value to the default value.
        // *** Note: The default value is mandatory if the
        // *** argument is required.
        else {
          // *** Note: When this value in the state changes,
          // *** the effect's arguments automatically updates
          // *** with the current value.
          setNodeValue(defaultNode)
        }
      }
    }
    // Or, if the argument is optional and its type
    // is a boolean...
    else if (!arg.required && arg.type === 'boolean') {
      // ...then set the boolean value to the current value.
      // *** Note: The boolean is a special case because
      // *** it only has two states: true or false. Therefore,
      // *** the value is always defined which means that it
      // *** should always be included in the effect's arguments.
      setEffectArgs((prev) => ({ ...prev, [arg._id]: booleanValue }))
    }
  }

  /* -- RENDER -- */

  // If the argument type is "dropdown" then render
  // the dropdown.
  if (arg.type === 'dropdown' && allDependenciesMet) {
    return arg.required ? (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropdown<TDropdownArgOption>
          fieldType={'required'}
          label={arg.name}
          options={availableDropdownOptions}
          stateValue={dropDownValue}
          setState={setDropDownValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          // todo: reevaluate default values for dropdown target-argument types
          // defaultValue={arg.default}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
      </div>
    ) : (
      <div className={`ArgEntry Dropdown`}>
        <DetailDropdown<TDropdownArgOption>
          fieldType={'optional'}
          label={arg.name}
          options={availableDropdownOptions}
          stateValue={optionalDropDownValue}
          setState={setOptionalDropDownValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
      </div>
    )
  }
  // If the argument type is "number" then render
  // the number input.
  else if (arg.type === 'number' && allDependenciesMet) {
    return arg.required ? (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'required'}
          label={arg.name}
          stateValue={numberValue}
          setState={setNumberValue}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    ) : (
      <div className={`ArgEntry Number`}>
        <DetailNumber
          fieldType={'optional'}
          label={arg.name}
          stateValue={optionalNumberValue}
          setState={setOptionalNumberValue}
          minimum={arg.min}
          maximum={arg.max}
          unit={arg.unit}
          placeholder='Enter a number...'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "string" then render
  // the string input.
  else if (arg.type === 'string' && allDependenciesMet) {
    return (
      <div className={`ArgEntry String`}>
        <DetailString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={stringValue}
          setState={setStringValue}
          defaultValue={arg.required ? arg.default : undefined}
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "large-string" then render
  // the large-string input.
  else if (arg.type === 'large-string' && allDependenciesMet) {
    return (
      <div className={`ArgEntry LargeString`}>
        <DetailLargeString
          fieldType={arg.required ? 'required' : 'optional'}
          handleOnBlur={arg.required ? 'repopulateValue' : 'none'}
          label={arg.name}
          stateValue={largeStringValue}
          setState={setLargeStringValue}
          defaultValue={arg.required ? arg.default : undefined}
          elementBoundary='.SidePanelSection'
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "boolean" then render
  // the boolean toggle.
  else if (arg.type === 'boolean' && allDependenciesMet) {
    return (
      <div className={`ArgEntry Boolean`}>
        <DetailToggle
          fieldType='required'
          label={arg.name}
          stateValue={booleanValue}
          setState={setBooleanValue}
          tooltipDescription={arg.tooltipDescription}
        />
      </div>
    )
  }
  // If the argument type is "force" then render
  // the force dropdown.
  else if (arg.type === 'force' && allDependenciesMet) {
    return arg.required ? (
      <div className={`ArgEntry Force`}>
        <DetailDropdown<ClientMissionForce>
          fieldType={'required'}
          label={arg.name}
          options={mission.forces}
          stateValue={forceValue}
          setState={setForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
      </div>
    ) : (
      <div className={`ArgEntry Force`}>
        <DetailDropdown<ClientMissionForce>
          fieldType={'optional'}
          label={arg.name}
          options={mission.forces}
          stateValue={optionalForceValue}
          setState={setOptionalForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
      </div>
    )
  }
  // If the argument type is "node" then render
  // dropdowns for forces and nodes.
  else if (arg.type === 'node' && allDependenciesMet) {
    return arg.required ? (
      <div className={`ArgEntry Node`}>
        <DetailDropdown<ClientMissionForce>
          fieldType={'required'}
          label={ForceArg.NAME}
          options={mission.forces}
          stateValue={forceValue}
          setState={setForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
        <DetailDropdown<ClientMissionNode>
          fieldType={'required'}
          label={arg.name}
          options={forceValue?.nodes ?? []}
          stateValue={nodeValue}
          setState={setNodeValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={requiredHandleInvalidNodeOption}
        />
      </div>
    ) : (
      <div className={`ArgEntry Node`}>
        <DetailDropdown<ClientMissionForce | null>
          fieldType={'optional'}
          label={ForceArg.NAME}
          options={mission.forces}
          stateValue={optionalForceValue}
          setState={setOptionalForceValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={{
            method: 'warning',
          }}
        />
        <DetailDropdown<ClientMissionNode | null>
          fieldType={'optional'}
          label={arg.name}
          options={optionalForceValue?.nodes ?? []}
          stateValue={optionalNodeValue}
          setState={setOptionalNodeValue}
          isExpanded={false}
          tooltipDescription={arg.tooltipDescription}
          renderDisplayName={(option) => option.name}
          handleInvalidOption={optionalHandleInvalidNodeOption}
        />
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR ARG GROUPINGS ---------------------------- */

/**
 * The props for the ArgGroupings component.
 */
export type TArgGroupings_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The effect's target.
   */
  target: ClientEffect['target']
  /**
   * The argument to render.
   */
  arg: TTargetArg
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: ReactSetter<ClientEffect['args']>
}
