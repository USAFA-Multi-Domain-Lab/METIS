import React, { useMemo, useRef, useState } from 'react'
import { TMetisClientComponents } from 'src'
import EffectList from 'src/components/content/data/lists/implementations/EffectList'
import { TList_E } from 'src/components/content/data/lists/List'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import useEffectItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/effects'
import { useGlobalContext } from 'src/context/global'
import { LocalContextProvider } from 'src/context/local'
import { ClientEffect, TClientEffectHost } from 'src/missions/effects'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import { TEffectType } from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { timelineContext } from './context'
import './EffectTimeline.scss'
import { TimelineSection } from './subcomponents/TimelineSection'

/**
 * Presents a timeline view of effects for a given
 * effect host, providing options to create new
 * effects, as well as manage existing ones.
 */
export function EffectTimeline<TType extends TEffectType>(
  props: TEffectTimeline_P<TType>,
): JSX.Element | null {
  /* -- PROPS -- */

  const { host } = props

  /* -- STATE -- */

  const { isAuthorized } = useRequireLogin()
  const globalContext = useGlobalContext()
  const { showButtonMenu } = globalContext.actions
  const missionPageContext = useMissionPageContext()
  const {
    onChange,
    activateEffectModal,
    state: missionPageState,
  } = missionPageContext
  const [localFiles] = missionPageState.localFiles
  const { onDuplicateRequest, onDeleteRequest } =
    useEffectItemButtonCallbacks(host)
  const state: TEffectTimeline_S<TType> = {
    draggedItem: useState<TMetisClientComponents[TType] | null>(null),
    draggedItemStartY: useState<number>(0),
    itemOrderUpdateId: useState<string>(StringToolbox.generateRandomId()),
  }
  const [itemOrderUpdateId] = state.itemOrderUpdateId
  const [newEffectTrigger, setNewEffectTrigger] = useState<
    ClientEffect<TType>['trigger']
  >(host.validTriggers[0])
  const createEffectEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'shell',
        type: 'button',
        icon: 'shell',
        label: 'Output Message',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(newEffectTrigger, ClientTarget.METIS_TARGET_IDS.OUTPUT)
        },
      },
      {
        key: 'ban',
        type: 'button',
        icon: 'ban',
        label: 'Block Status',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(
            newEffectTrigger,
            ClientTarget.METIS_TARGET_IDS.BLOCK_STATUS,
          )
        },
      },
      {
        key: 'file',
        type: 'button',
        icon: 'file',
        label: 'File Access',
        permissions: ['missions_write'],
        disabled: localFiles.length === 0,
        onClick: () => {
          createEffect(
            newEffectTrigger,
            ClientTarget.METIS_TARGET_IDS.FILE_ACCESS,
          )
        },
      },
      {
        key: 'open',
        type: 'button',
        icon: 'door',
        label: 'Open Status',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(
            newEffectTrigger,
            ClientTarget.METIS_TARGET_IDS.OPEN_NODE,
          )
        },
      },
      {
        key: 'add',
        type: 'button',
        icon: 'add',
        label: 'Custom Effect',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(newEffectTrigger)
        },
      },
    ],
    options: {
      revealLabels: true,
      flow: 'column',
    },
    dependencies: [localFiles.length],
  })
  const elements: TEffectTimeline_E = {
    root: useRef<HTMLDivElement>(null),
  }

  /* -- COMPUTED -- */

  /**
   * A map of triggers to their corresponding list
   * elements.
   */
  const listRefMap = useRef(
    compute(() => {
      let map: Record<string, React.MutableRefObject<TList_E | null>> = {}

      for (let trigger of host.validTriggers) {
        map[trigger] = React.createRef<TList_E>()
      }

      return map
    }),
  )

  /**
   * A map of trigger to their corresponding effects.
   */
  const effectsMap = useMemo<
    Record<string, TMetisClientComponents[TType][]>
  >(() => {
    let map: Record<string, TMetisClientComponents[TType][]> = {}

    for (let trigger of host.validTriggers) {
      map[trigger] = []
    }
    for (let effect of host.effects) {
      map[effect.trigger].push(effect)
    }
    // Sort each trigger's effects by order
    for (let trigger of host.validTriggers) {
      map[trigger].sort((a, b) => a.order - b.order)
    }

    return map
  }, [...host.validTriggers, host.effects, itemOrderUpdateId])

  /* -- FUNCTIONS -- */

  /**
   * Shows the effect preset menu, presenting various options
   * for creating a new effect.
   * @param newEffectTrigger The trigger for the new effect.
   */
  const showEffectPresetMenu = (
    newEffectTrigger: ClientEffect<TType>['trigger'],
  ) => {
    let listElm: HTMLDivElement | null | undefined =
      listRefMap.current[newEffectTrigger].current?.root.current

    if (!listElm) {
      throw new Error('List ref is null')
    }

    // Get the create effect button then confirm
    // it is present.
    const createEffectButton = listElm.querySelector<HTMLDivElement>(
      '.ListNav .ButtonSvgPanel .ButtonSvg_add',
    )

    if (!createEffectButton) {
      console.warn('ActionEntry: createEffectButton is null')
      return
    }

    // Activate the effect preset menu.
    showButtonMenu(createEffectEngine, {
      positioningTarget: createEffectButton,
    })
    setNewEffectTrigger(newEffectTrigger)
  }

  /**
   * Handles creating a new effect from a preset.
   */
  const createEffect = (
    trigger: ClientEffect<TType>['trigger'],
    targetId?: string,
  ) => {
    // If no target ID is provided, one must be
    // selected, therefore activate the effect
    // modal.
    if (!targetId) {
      activateEffectModal(host, trigger)
      return
    }

    // Confirm target can be found.
    const target = ClientTargetEnvironment.REGISTRY.inferTarget(targetId)
    if (!target) {
      console.warn('ActionEntry: No target found for new preset effect.')
      return
    }

    // Create the effect, select it, and
    // notify of changes.
    const effect = host.createEffect(target, trigger)
    host.mission.select(effect)
    onChange(effect)
  }

  /**
   * Callback for when the order of items in a list
   * is changed by drag-and-drop.
   */
  const onReorder = () => {
    // Rebuild the host's effects array
    // based on the order of effects in
    // each list.
    host.effects = host.validTriggers.flatMap(
      (trigger: ClientEffect<TType>['trigger']) => {
        return effectsMap[trigger]
      },
    )
    onChange(host)
  }

  /* -- RENDER -- */

  /**
   * Takes the effects map and creates a corresponding
   * List component of effects for each trigger.
   */
  const listsJsx = compute<JSX.Element[]>(() => {
    return host.validTriggers.map((trigger: ClientEffect<TType>['trigger']) => {
      return (
        <EffectList<TType>
          key={trigger}
          name={StringToolbox.toTitleCase(trigger)}
          items={effectsMap[trigger]}
          elementAccess={listRefMap.current[trigger]}
          onCreateRequest={() => {
            showEffectPresetMenu(trigger)
          }}
          onDuplicateRequest={onDuplicateRequest}
          onDeleteRequest={onDeleteRequest}
          initialSorting={{ method: 'unsorted', fixedConfig: true }}
          ordering={{ mode: 'maleable' }}
          itemsPerPageMin={5}
          getItemTooltip={(effect) => {
            if (!effect.environment || !effect.target) {
              return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
            } else if (isAuthorized('missions_write')) {
              return 'Edit effect.'
            } else if (isAuthorized('missions_read')) {
              return 'View effect.'
            } else {
              return ''
            }
          }}
          onOpenRequest={(effect) => {
            host.mission.select(effect)
          }}
          onReorder={onReorder}
        />
      )
    })
  })

  /**
   * The JSX elements for all effects across all valid triggers.
   */
  const effectsSectionsJsx = compute<JSX.Element[]>(() => {
    return host.validTriggers
      .map((trigger: ClientEffect<TType>['trigger']) => (
        <TimelineSection
          key={trigger}
          trigger={trigger}
          effects={effectsMap[trigger]}
        />
      ))
      .filter(Boolean) as JSX.Element[]
  })

  return (
    <LocalContextProvider
      context={timelineContext}
      defaultedProps={props}
      computed={{}}
      state={state}
      elements={elements}
    >
      <div className='EffectTimeline' ref={elements.root}>
        <h3 className='TimelineHeading'>Effects</h3>
        {effectsSectionsJsx}
        <h3 className='TimelineHeadingLegacy'>Effects - Legacy</h3>
        {listsJsx}
      </div>
    </LocalContextProvider>
  )
}

/**
 * Props for {@link EffectTimeline}.
 */
export type TEffectTimeline_P<TType extends TEffectType> = {
  /**
   * The mission component hosting the list of effects.
   */
  host: TClientEffectHost<TType>
}

/**
 * State for {@link EffectTimeline}.
 */
export type TEffectTimeline_S<TType extends TEffectType> = {
  /**
   * The currently dragged item.
   */
  draggedItem: TReactState<TMetisClientComponents[TType] | null>

  /**
   * The starting Y position of the dragged item.
   */
  draggedItemStartY: TReactState<number>
  /**
   * Represents an update to the order of items
   * in the timeline, which can be used to trigger
   * effects when the order changes.
   */
  itemOrderUpdateId: TReactState<string>
}

/**
 * Elements that need to be referenced throughout the
 * {@link EffectTimeline} component tree.
 */
export type TEffectTimeline_E = {
  /**
   * The root element of the list.
   */
  root: React.RefObject<HTMLDivElement>
}
