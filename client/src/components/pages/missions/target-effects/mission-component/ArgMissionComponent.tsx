import DetailMultiSelect from '@client/components/content/form/dropdowns/multiselect/DetailMultiSelect'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import type { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { useMountHandler } from '@client/toolbox/hooks'
import type {
  TMissionComponentArg2,
  TMissionComponentType,
} from '@shared/target-environments/args/mission-component/MissionComponentArg2'
import { useEffect, useMemo, useState } from 'react'
import type { TMissionOutlineItem } from '../../structures/MissionOutline'
import MissionOutline, {
  computeOutlineIconStyling,
} from '../../structures/MissionOutline'
import './ArgMissionComponent.scss'

/**
 * Renders dropdowns for the argument whose type is `"force"`, `"node"`, `"action"`, `"file"`, `"pool"`, or `"resource"`.
 */
export default function ArgMissionComponent2({
  effect,
  effect: { mission, sourceForce, sourceNode, sourceAction },
  arg,
  arg: { _id, type, required, tooltipDescription },
  initialize,
  effectArgs,
  setEffectArgs,
}: TArgMissionComponent_P): TReactElement | null {
  const [value, setValue] = useState<TMissionOutlineItem[]>([])

  /* -- COMPUTED -- */

  // A list of JS classes. If an outline item is an instance
  // of any of these classes, then it is selectable in the outline.
  let selectableOutlineItemTypes = useMemo(() => {
    let { validComponentTypes = ['any'] } = arg
    let typeToClassMap = {
      mission: ClientMission,
      force: ClientMissionForce,
      node: ClientMissionNode,
      action: ClientMissionAction,
      file: ClientMissionFile,
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
  }, [arg.validComponentTypes])
  // A list of JS classes. If an outline item is an instance
  // of any of these classes, then it will be displayed in the
  // outline. This is different from selectableOutlineItemTypes
  // because we still want to display non-selectable items if
  // they house selectable items (e.g. a node that contains selectable
  // actions should still be displayed, even if the node itself
  // isn't selectable).
  let displayableOutlineItemTypes = useMemo(() => {
    let result: typeof selectableOutlineItemTypes = [
      ClientMission,
      ClientMissionForce,
      ClientMissionNode,
      ClientMissionAction,
      ClientMissionFile,
    ]

    // Cascading filtering. We only want to filter out a class
    // if it's not selectable and its outline descendants aren't
    // either. For example, the force should only be filtered out
    // if the actions and nodes inside are also not selectable.
    if (!selectableOutlineItemTypes.includes(ClientMissionAction)) {
      result = result.filter(
        (ComponentClass) => ComponentClass !== ClientMissionAction,
      )

      if (!selectableOutlineItemTypes.includes(ClientMissionNode)) {
        result = result.filter(
          (ComponentClass) => ComponentClass !== ClientMissionNode,
        )

        if (!selectableOutlineItemTypes.includes(ClientMissionForce)) {
          result = result.filter(
            (ComponentClass) => ComponentClass !== ClientMissionForce,
          )
        }
      }
    }

    if (!selectableOutlineItemTypes.includes(ClientMissionFile)) {
      result = result.filter(
        (ComponentClass) => ComponentClass !== ClientMissionFile,
      )
    }

    return result
  }, [selectableOutlineItemTypes])

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    done()
  })

  useEffect(() => {
    setEffectArgs((prevArgs) => {
      prevArgs
    })
  }, [value])

  /* -- RENDER -- */

  return (
    <div className='ArgMissionComponent'>
      <DetailMultiSelect<TMissionOutlineItem>
        label={arg.name}
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

/* -- FUNCTIONS -- */

/**
 * Serializes a selection of mission components into an
 * array of tuples, where the first item is the type of
 * the component (e.g. "force", "node", "action") and the
 * rest of the items are the keys needed to identify that
 * the component within the mission (e.g. force key, node key,
 * action key). This makes it ready to be sent to the server
 * and saved in the database as part of effect args.
 * @param value The deserialized selection.
 * @returns The serialized version of the value.
 */
function serialize(
  value: TMissionOutlineItem[],
): Array<TMissionComponentSerializedSelection> {
  return value.map((item) => {
    let { name: lastKnownName } = item

    if (item instanceof ClientMission) {
      return { type: 'mission', lastKnownName, keys: [] }
    } else if (item instanceof ClientMissionForce) {
      return { type: 'force', lastKnownName, keys: [item.localKey] }
    } else if (item instanceof ClientMissionNode) {
      return {
        type: 'node',
        lastKnownName,
        keys: [item.force.localKey, item.localKey],
      }
    } else if (item instanceof ClientMissionAction) {
      return {
        type: 'action',
        lastKnownName,
        keys: [item.force.localKey, item.node.localKey, item.localKey],
      }
    } else {
      throw new Error(`Unsupported outline item type: ${item.constructor.name}`)
    }
  })
}

/**
 * Deserializes a selection of serialized mission components back into
 * their live mission component objects. Components that no longer exist
 * in the mission (e.g. deleted since the selection was saved) are
 * silently filtered out.
 * @param serialized The serialized selection.
 * @param mission The mission to look up components in.
 * @returns The deserialized selection.
 */
function deserialize(
  serialized: TMissionComponentSerializedSelection[],
  mission: ClientMission,
): TMissionOutlineItem[] {
  return serialized.flatMap((item): TMissionOutlineItem[] => {
    const { type, keys } = item

    if (type === 'mission') {
      return [mission]
    } else if (type === 'force') {
      const force = mission.getForceByLocalKey(keys[0])
      return force ? [force] : []
    } else if (type === 'node') {
      const node = mission.getNodeByLocalKey(keys[0], keys[1])
      return node ? [node] : []
    } else if (type === 'action') {
      const action = mission.getActionByLocalKey(keys[0], keys[1], keys[2])
      return action ? [action] : []
    } else {
      return []
    }
  })
}

/* -- TYPES -- */

/**
 * The props for the `ArgMissionComponent` component.
 */
type TArgMissionComponent_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg2
  /**
   * Determines if the argument needs to be initialized.
   */
  initialize: boolean
  /**
   * The arguments that the effect uses to modify the target.
   */
  effectArgs: ClientEffect['args']
  /**
   * Function that updates the value of the effect's arguments
   * stored in the state.
   */
  setEffectArgs: TReactSetter<ClientEffect['args']>
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
  type: TMissionComponentType
  /**
   * The last known name of the component that was selected.
   * This is useful when, for whatever reason, the selection
   * is present in the args, but the actual component cannot
   * be found in the mission.
   */
  lastKnownName: string
  /**
   * The keys needed to identify the component within the mission.
   * For example, if the component is a node, this would be
   * [forceKey, nodeKey]. If it's an action, this would be
   * [forceKey, nodeKey, actionKey].
   */
  keys: string[]
}
