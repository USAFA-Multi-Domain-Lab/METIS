import React, { useMemo, useRef, useState } from 'react'
import { TMetisClientComponents } from 'src'
import EffectList from 'src/components/content/data/lists/implementations/EffectList'
import { TList_E } from 'src/components/content/data/lists/List'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from 'src/components/pages/missions/context'
import useEffectItemButtonCallbacks from 'src/components/pages/missions/hooks/mission-components/effects'
import { useGlobalContext } from 'src/context/global'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import { TEffectHost } from '../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../shared/toolbox/strings'

/**
 * Presents a timeline view of effects for a given
 * effect host, providing options to create new
 * effects, as well as manage existing ones.
 */
export default function EffectTimeline<
  THost extends TEffectHost<TMetisClientComponents, any>,
>({ host }: TEffectTimeline_P<THost>): JSX.Element | null {
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
  const [newEffectTrigger, setNewEffectTrigger] =
    useState<THost['validTriggers'][number]>()
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
  const effectsMap = useMemo<Record<string, THost['effects']>>(() => {
    let map: Record<string, THost['effects']> = {}

    for (let trigger of host.validTriggers) {
      map[trigger] = []
    }
    for (let effect of host.effects) {
      map[effect.trigger].push(effect)
    }

    return map
  }, [...host.validTriggers, host.effects])

  /* -- FUNCTIONS -- */

  /**
   * Shows the effect preset menu, presenting various options
   * for creating a new effect.
   * @param newEffectTrigger The trigger for the new effect.
   */
  const showEffectPresetMenu = (
    newEffectTrigger: THost['validTriggers'][number],
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
    trigger: THost['validTriggers'][number],
    targetId?: string,
  ) => {
    // If no target ID is provided, one must be
    // selected, therefore activate the effect
    // modal.
    if (!targetId) {
      activateEffectModal(trigger)
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
    let effects: THost['effects'] = []

    for (let trigger of host.validTriggers) {
      effects.push(...effectsMap[trigger])
    }
    host.effects = effects

    onChange(host)
  }

  /* -- RENDER -- */

  /**
   * Takes the effects map and creates a corresponding
   * List component of effects for each trigger.
   */
  const listsJsx = compute<JSX.Element[]>(() => {
    return Object.entries(effectsMap).map(([trigger, effects]) => {
      return (
        <EffectList
          key={trigger}
          name={StringToolbox.toTitleCase(trigger)}
          items={effects as any}
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

  return (
    <div className='EffectTimeline'>
      <h3>Effects</h3>
      {listsJsx}
    </div>
  )
}

/**
 * Props for {@link EffectTimeline}.
 */
export type TEffectTimeline_P<
  THost extends TEffectHost<TMetisClientComponents, any>,
> = {
  /**
   * The mission component hosting the list of effects.
   */
  host: THost
}
