import { TMetisClientComponents } from 'src'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/panels/hooks'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context/global'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import {
  TEffectTrigger,
  TEffectType,
} from '../../../../../../../../shared/missions/effects'
import StringToolbox from '../../../../../../../../shared/toolbox/strings'
import { useMissionPageContext } from '../../../context'
import { useTimelineContext } from '../context'
import { TimelineItem } from './items/TimelineItem'
import { TimelineNoItems } from './items/TimelineNoItems'
import './TimelineSection.scss'

/**
 * A section displaying timeline items specific to
 * the given effect trigger.
 */
export function TimelineSection<TType extends TEffectType>({
  trigger,
  effects,
}: TTimelineSection_P<TType>) {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { showButtonMenu } = globalContext.actions
  const {
    onChange,
    activateEffectModal,
    state: pageState,
  } = useMissionPageContext()
  const [localFiles] = pageState.localFiles
  const { host } = useTimelineContext<TType>()
  const buttonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'add',
        icon: 'add',
        type: 'button',
        label: `Add an effect for "${StringToolbox.toTitleCase(trigger)}".`,
        permissions: ['missions_write'],
        onClick: (event) => onAddRequest(event),
      },
    ],
  })
  const createEffectEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'shell',
        type: 'button',
        icon: 'shell',
        label: 'Output Message',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(ClientTarget.METIS_TARGET_IDS.OUTPUT)
        },
      },
      {
        key: 'ban',
        type: 'button',
        icon: 'ban',
        label: 'Block Status',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(ClientTarget.METIS_TARGET_IDS.BLOCK_STATUS)
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
          createEffect(ClientTarget.METIS_TARGET_IDS.FILE_ACCESS)
        },
      },
      {
        key: 'open',
        type: 'button',
        icon: 'door',
        label: 'Open Status',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect(ClientTarget.METIS_TARGET_IDS.OPEN_NODE)
        },
      },
      {
        key: 'add',
        type: 'button',
        icon: 'add',
        label: 'Custom Effect',
        permissions: ['missions_write'],
        onClick: () => {
          createEffect()
        },
      },
    ],
    options: {
      revealLabels: true,
      flow: 'column',
    },
    dependencies: [localFiles.length],
  })

  /* -- FUNCTIONS -- */

  /**
   * Handles creating a new effect from a preset.
   */
  const createEffect = (targetId?: string) => {
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
   * Callback for when the add button is clicked. This
   * will show a menu of predefined effects to create,
   * along with an option create a custom effect.
   */
  const onAddRequest = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    // Activate the effect preset menu.
    showButtonMenu(createEffectEngine, {
      positioningTarget: event.currentTarget,
    })
  }

  /* -- RENDER -- */

  return (
    <section className='TimelineSection'>
      <div className='TimelineSectionHeader'>
        <div className='TimelineSectionHeading'>
          {StringToolbox.toTitleCase(trigger)}
        </div>
        <ButtonSvgPanel engine={buttonEngine} />
      </div>
      <div className='TimelineItems'>
        <If condition={effects.length === 0}>
          <TimelineNoItems trigger={trigger} />
        </If>
        <If condition={effects.length > 0}>
          {effects.map((effect) => (
            <TimelineItem key={effect._id} item={effect} />
          ))}
        </If>
      </div>
    </section>
  )
}

/**
 * Props for {@link TimelineSection}.
 */
export type TTimelineSection_P<TType extends TEffectType> = {
  /**
   * The effect trigger by which the items are grouped
   * in this section.
   */
  trigger: TEffectTrigger
  /**
   * The group of effects for the given trigger.
   */
  effects: TMetisClientComponents[TType][]
}
