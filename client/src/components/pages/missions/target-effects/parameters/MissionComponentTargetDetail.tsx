import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionResource } from '@client/missions/ClientMissionResource'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientResourcePool } from '@client/missions/forces/ClientResourcePool'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import type {
  TMissionComponentTargetParameter2,
  TMissionComponentType,
} from '@shared/target-environments/parameters/mission-component/MissionComponentTargetParameter2'
import { useMemo, useState } from 'react'
import type { TMissionOutlineItem } from '../../structures/MissionOutline'
import MissionOutline, {
  computeOutlineIconStyling,
} from '../../structures/MissionOutline'
import './MissionComponentTargetDetail.scss'

/**
 * Renders dropdowns for the argument whose type is `"force"`, `"node"`, `"action"`, `"file"`, `"pool"`, or `"resource"`.
 */
export default function MissionComponentTargetDetail2({
  effect,
  effect: { mission, sourceForce, sourceNode, sourceAction },
  parameter,
  parameter: { _id, type, required, tooltipDescription },
  initialize,
  targetArguments,
  setTargetArguments,
}: TMissionComponentTargetDetail_P): TReactElement | null {
  const [value, setValue] = useState<TMissionOutlineItem[]>([])

  /* -- COMPUTED -- */

  // A list of JS classes. If an outline item is an instance
  // of any of these classes, then it is selectable in the outline.
  let selectableOutlineItemTypes = useMemo(() => {
    let { validComponentTypes = ['any'] } = parameter
    let typeToClassMap = {
      'mission': ClientMission,
      'force': ClientMissionForce,
      'node': ClientMissionNode,
      'action': ClientMissionAction,
      'file': ClientMissionFile,
      'resource': ClientMissionResource,
      'resource-pool': ClientResourcePool,
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

  /* -- EFFECTS -- */

  // useMountHandler((done) => {
  //   done()
  // })

  // useEffect(() => {
  //   setTargetArguments((prevArgs) => {
  //     prevArgs
  //   })
  // }, [value])

  /* -- RENDER -- */

  return (
    <div className='TargetDetail MissionComponentTargetDetail'>
      <DetailMultiSelect<TMissionOutlineItem>
        label={parameter.name}
        tooltipDescription={tooltipDescription}
        value={value}
        setValue={setValue}
        getKey={({ _id }) => _id}
        render={(item) => {
          return (
            <div className='ComponentItemContent'>
              <div
                className='Icon'
                style={computeOutlineIconStyling(item)}
              ></div>
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
    </div>
  )
}

/* -- TYPES -- */

/**
 * The props for the `ArgMissionComponent` component.
 */
type TMissionComponentTargetDetail_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The string parameter defining the requirements for the argument.
   */
  parameter: TMissionComponentTargetParameter2
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to call the target script.
   */
  targetArguments: ClientEffect['arguments']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setTargetArguments: TReactSetter<ClientEffect['arguments']>
}

/**
 * A serialized selection of a mission component, which can
 * be saved with effect args to the database.
 */
type TMissionComponentSerializedSelection = {
  /**
   * The type of mission component selected (e.g. "force",
   * "node", "action").
   */
  componentType: TMissionComponentType
  /**
   * The last known name of the component that was selected.
   * This is useful when, for whatever reason, the selection
   * is present in the args, but the actual component cannot
   * be found in the mission.
   */
  lastKnownName: string
  /**
   * A string of identifiers used to find the component
   * quickly in the mission. The identifiers define a
   * path to the component in the mission outline. For example,
   * [forceId, nodeId, actionId] would be the path to an action.
   * @note The IDs of the ancestor components are included
   * for quicker lookup.
   */
  ids: string[]
}
