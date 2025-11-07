import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { compute } from '@client/toolbox'
import { useRequireLogin } from '@client/toolbox/hooks'
import { CallToolbox } from '@shared/toolbox/calls/CallToolbox'
import { useEffect } from 'react'
import useEffectItemButtonCallbacks from '../../../hooks/mission-components/effects'
import { useTimelineContext } from '../context'
import './TimelineControlPanel.scss'

/**
 * Provides controls to the {@link EffectTimeline}
 * component to manage the effects housed by it,
 * such as viewing, adding duplicating, and deleting
 * effects.
 */
export default function TimelineControlPanel({}: TTimelineControlPanel_P): TReactElement | null {
  /* -- STATE -- */

  const { isAuthorized } = useRequireLogin()
  const { host, state, elements } = useTimelineContext()
  const [selection] = state.selection
  const { onDuplicateRequest, onDeleteRequest } =
    useEffectItemButtonCallbacks(host)
  const engine = useButtonSvgEngine({
    elements: [
      {
        key: 'open',
        icon: 'open',
        type: 'button',
        permissions: ['missions_read'],
        onClick: () => {
          if (selection) {
            host.mission.select(selection)
          }
        },
      },
      {
        key: 'duplicate',
        icon: 'copy',
        type: 'button',
        label: 'Duplicate the selected effect.',
        permissions: ['missions_write'],
        onClick: () => CallToolbox.ifNonNullable(onDuplicateRequest, selection),
      },
      {
        key: 'delete',
        icon: 'remove',
        type: 'button',
        label: 'Delete the selected effect.',
        permissions: ['missions_write'],
        onClick: () => CallToolbox.ifNonNullable(onDeleteRequest, selection),
      },
    ],
  })

  /* -- EFFECTS -- */

  // Enable/disable item-dependent buttons upon
  // selection changes.
  useEffect(() => {
    // Disable buttons if no selection, enable
    // them otherwise.
    engine.setDisabled('open', !selection)
    engine.setDisabled('duplicate', !selection)
    engine.setDisabled('delete', !selection)

    // Update the open button label based on
    // the authorization of the user and the
    // presence of a target-environment and
    // target for the selected effect.
    let openButton = engine.get('open')
    if (openButton && openButton.type === 'button') {
      openButton.label = compute<string>(() => {
        if (!selection) {
          return ''
        } else if (!selection.environment || !selection.target) {
          return 'This effect cannot be edited because either the target environment or the target associated with this effect is not available.'
        } else if (isAuthorized('missions_write')) {
          return 'View/Edit effect.'
        } else {
          return 'View effect.'
        }
      })
    }
  }, [selection])

  /* -- RENDER -- */

  return (
    <div className={'TimelineControlPanel'} ref={elements.controlPanel}>
      <div className='TimelineHeading'>Effects</div>
      <ButtonSvgPanel engine={engine} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link TimelineControlPanel}.
 */
export type TTimelineControlPanel_P = {}

/**
 * State for {@link TimelineControlPanel}.
 */
export type TTimelineControlPanel_S = {}
