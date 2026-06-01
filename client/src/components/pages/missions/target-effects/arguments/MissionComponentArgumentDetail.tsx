import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionResource } from '@client/missions/ClientMissionResource'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientResourcePool } from '@client/missions/forces/ClientResourcePool'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type { ClientTargetArgument } from '@client/target-environments/arguments/ClientTargetArgument'
import { useObjectFormSync } from '@client/toolbox/hooks'
import { useMemo } from 'react'
import { useMissionPageContext } from '../../context'
import type { TMissionOutlineItem } from '../../structures/MissionOutline'
import MissionOutline, {
  computeOutlineIconStyling,
} from '../../structures/MissionOutline'

/**
 * Renders a multi-select for the argument whose type is `"mission-component"`.
 * @note Renders nothing if the argument or parameter type is not `"mission-component"`.
 */
export default function MissionComponentTargetDetail({
  argument,
}: TMissionComponentTargetDetail_P): TReactElement | null {
  const { parameter } = argument

  /* -- STATE -- */

  const { onChange } = useMissionPageContext()
  const formState = useObjectFormSync(argument, ['context'], {
    onChange: () => onChange(argument),
  })
  const [context, setContext] = formState.context

  /* -- VALIDATION -- */

  if (
    context.type !== 'mission-component' ||
    !parameter ||
    parameter.type !== 'mission-component'
  ) {
    return null
  }

  /* -- STATE (CONTINUED) -- */

  const { value } = context
  const setValue: TReactSetter<TMissionOutlineItem[]> = (newValue) => {
    setContext({
      ...context,
      value: (typeof newValue === 'function'
        ? newValue(value as TMissionOutlineItem[])
        : newValue) as typeof value,
    })
  }

  /* -- COMPUTED -- */

  const { mission } = argument.effect

  /* -- COMPUTED -- */
  // A list of JS classes. If an outline item is an instance
  // of any of these classes, then it is selectable in the outline.
  let selectableOutlineItemTypes = useMemo(() => {
    let { validComponentTypes = ['any'] } = parameter
    let typeToClassMap = {
      mission: ClientMission,
      force: ClientMissionForce,
      node: ClientMissionNode,
      action: ClientMissionAction,
      missionFile: ClientMissionFile,
      resource: ClientMissionResource,
      resourcePool: ClientResourcePool,
    } as const

    // If "any" is included, all types are valid,
    // so return early.
    if (validComponentTypes.includes('any')) {
      return Object.values(typeToClassMap)
    }

    // Otherwise map string literals to the corresponding
    // client-sided classes and return it as a unique
    // (duplicates filtered out) array.
    return Array.from(
      new Set(
        validComponentTypes.map((type) => {
          if (type === 'any') {
            throw new Error(
              'Found "any" in types. This should theoretically be impossible due to the check above.',
            )
          }
          return typeToClassMap[type]
        }),
      ),
    )
  }, [parameter.validComponentTypes])

  // A list of JS classes. If an outline item is an instance
  // of any of these classes, then it will be displayed in the
  // outline. This is different from selectableOutlineItemTypes
  // because we still want to display non-selectable items if
  // they house selectable items (e.g. a node that contains selectable
  // actions should still be displayed, even if the node itself
  // isn't selectable).
  let displayableOutlineItemTypes = useMemo(() => {
    let result = new Set<(typeof selectableOutlineItemTypes)[number]>()
    let addIfIncludes = <T extends (typeof selectableOutlineItemTypes)[number]>(
      ifComponent: T,
      addComponents: T[],
    ) => {
      if (selectableOutlineItemTypes.includes(ifComponent)) {
        addComponents.forEach((classReference) => result.add(classReference))
      }
    }

    addIfIncludes(ClientMissionAction, [
      ClientMissionForce,
      ClientMissionNode,
      ClientMissionAction,
    ])
    addIfIncludes(ClientMissionNode, [ClientMissionForce, ClientMissionNode])
    addIfIncludes(ClientMissionForce, [ClientMissionForce])
    addIfIncludes(ClientMissionFile, [ClientMissionFile])
    addIfIncludes(ClientMissionResource, [ClientMissionResource])
    addIfIncludes(ClientResourcePool, [ClientMissionForce, ClientResourcePool])

    return Array.from(result)
  }, [selectableOutlineItemTypes])

  /* -- RENDER -- */

  return (
    <DetailMultiSelect<TMissionOutlineItem>
      label={parameter.name}
      tooltipDescription={parameter.tooltipDescription}
      value={value}
      setValue={setValue}
      getKey={({ _id }) => _id}
      render={(item) => {
        return (
          <div className='ComponentItemContent'>
            <div className='Icon' style={computeOutlineIconStyling(item)}></div>
            <div className='Name'>{item.name}</div>
          </div>
        )
      }}
      options={[]}
      renderOptions={() => (
        <MissionOutline
          root={mission}
          selectionState={[value, setValue]}
          isSelectable={(item) =>
            selectableOutlineItemTypes.some((ComponentClass) => {
              return item instanceof ComponentClass
            })
          }
          filter={(item) => {
            return displayableOutlineItemTypes.some((ComponentClass) => {
              return item instanceof ComponentClass
            })
          }}
          isIndirectlySelectable={(item, parent) => {
            let isNode = item instanceof ClientMissionNode
            let parentIsNode = parent instanceof ClientMissionNode
            return !isNode || !parentIsNode
          }}
        />
      )}
    />
  )
}

/* -- TYPES -- */

/**
 * Props for {@link MissionComponentTargetDetail}.
 */
type TMissionComponentTargetDetail_P = {
  /**
   * A mission-component argument to render for view/edit.
   */
  argument: ClientTargetArgument
}
