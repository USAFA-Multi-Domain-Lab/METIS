import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import type { ClientMission } from '@client/missions/ClientMission'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { useEventListener } from '@client/toolbox/hooks'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useState } from 'react'
import { useMissionPageContext } from '../context'
import './EffectUpdateControl.scss'

/**
 * Displays an update control for one or more outdated effects,
 * managing the migration state machine and triggering migrations on click.
 */
export default function EffectUpdateControl(
  props: TEffectUpdateControl_P,
): TReactElement | null {
  /* -- PROPS -- */

  let mission: ClientMission
  let effect: ClientEffect | null = null

  if (props.scope === 'mission-wide') {
    mission = props.mission
  } else {
    mission = props.effect.mission
    effect = props.effect
  }

  /* -- STATE -- */

  const [outdatedEffects, setOutdatedEffects] = useState<ClientEffect[]>([])
  const { onChange } = useMissionPageContext()
  const [updateState, setUpdateState] = useState<TEffectUpdateState>('NoUpdate')

  const updateEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'update',
        type: 'button',
        icon: 'update',
        label: '',
        onClick: async () => {
          try {
            setUpdateState('UpdateInProgress')
            for (let effect of outdatedEffects) {
              await effect.$migrateArguments()
              onChange(effect)
            }
            setUpdateState('UpdateSucceeded')
          } catch (error) {
            setUpdateState('UpdateFailed')
          }
        },
      },
    ],
    options: { revealLabels: true },
  })

  const updateSuccessCloseEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'close',
        type: 'button',
        icon: 'close',
        description: 'Dismiss',
        onClick: () => setUpdateState('NoUpdate'),
      },
    ],
  })

  /* -- COMPUTED -- */

  let updateComponentClasses = new ClassList(
    'UpdateComponent',
    updateState,
  ).switch(
    {
      'mission-wide': 'MissionWideUpdate',
      'focused': 'FocusedUpdate',
    },
    props.scope,
  )

  /* -- FUNCTIONS -- */

  /**
   * Refreshes the list of outdated effects based on the current scope,
   * and transitions to UpdateAvailable if outdated effects are found
   * while the control is currently idle.
   */
  const refreshOutdated = () => {
    let effects: ClientEffect[]
    if (props.scope === 'mission-wide') {
      effects = mission.allEffects
    } else {
      effects = [props.effect]
    }
    effects = effects.filter((effect) =>
      effect.hasIssue(ClientEffect.ISSUE_KEY_OUTDATED),
    )
    setOutdatedEffects(effects)
    setUpdateState((current) =>
      current === 'NoUpdate' && effects.length > 0 ? 'UpdateAvailable' : current,
    )
  }

  /* -- EFFECTS -- */

  // Refresh outdated effects when appropriate.
  useEffect(() => {
    refreshOutdated()
  }, [effect, mission])
  useEventListener(mission.issueRegistry, 'change', () => refreshOutdated())

  /* -- RENDER -- */

  return (
    <div className={updateComponentClasses.value}>
      <div className='UpdateButtons'>
        <ButtonSvgPanel engine={updateEngine} />
      </div>
      <div className='UpdateStatusContent'>
        <div className='UpdateStatusIndicator'></div>
        <div className='UpdateStatusMessage'></div>
        <ButtonSvgPanel engine={updateSuccessCloseEngine} />
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Discriminating union variant for mission-wide effect updates.
 */
export type TEffectUpdateControl_P_MissionWide = {
  /**
   * Indicates the scope of updates that this control will trigger.
   * @option 'MissionWide' Updates any outdated effects in the entire mission
   * at once
   * @option 'Focused' Updates only the specific effect passed to the control.
   */
  scope: 'mission-wide'
  /**
   * The mission for which to control effect updates.
   */
  mission: ClientMission
}

/**
 * Discriminating union variant for single effect updates.
 */
export type TEffectUpdateControl_P_Focused = {
  scope: 'focused'
  /**
   * The specific effect to update with this control.
   */
  effect: ClientEffect
}

/**
 * Props for {@link EffectUpdateControl}.
 */
export type TEffectUpdateControl_P =
  | TEffectUpdateControl_P_MissionWide
  | TEffectUpdateControl_P_Focused

/**
 * The update state of the control, which determines whether
 * the update component is shown and what message it displays.
 */
export type TEffectUpdateState =
  | 'NoUpdate'
  | 'UpdateAvailable'
  | 'UpdateInProgress'
  | 'UpdateSucceeded'
  | 'UpdateFailed'
