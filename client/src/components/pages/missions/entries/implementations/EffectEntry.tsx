import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import useEffectItemButtonCallbacks from '@client/components/pages/missions/hooks/mission-components/effects'
import type { TMetisClientComponents } from '@client/index'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { compute } from '@client/toolbox'
import { useObjectFormSync } from '@client/toolbox/hooks'
import type {
  TEffectType,
  TSelectEffectContext,
} from '@shared/missions/effects/Effect'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import { DetailLargeString } from '../../../../content/form/DetailLargeString'
import { DetailLocked } from '../../../../content/form/DetailLocked'
import { DetailString } from '../../../../content/form/DetailString'
import TargetArgumentsEntry from '../../target-effects/arguments/TargetArgumentsSubentries'
import Entry from '../Entry'

/**
 * Entry fields for an effect.
 */
export default function EffectEntry<TType extends TEffectType>({
  effect,
  effect: { target, environment },
}: TEffectEntry_P<TType>): TReactElement | null {
  /* -- STATE -- */
  const { onChange, viewMode } = useMissionPageContext()
  const { onDuplicateRequest, onDeleteRequest } = useEffectItemButtonCallbacks(
    effect.host,
  )
  const effectState = useObjectFormSync(
    effect,
    ['name', 'trigger', 'description', 'arguments'],
    { onChange: () => onChange(effect) },
  )
  const [name, setName] = effectState.name
  const [trigger, setTrigger] = effectState.trigger
  const [description, setDescription] = effectState.description
  const [targetArguments, setTargetArguments] = effectState.arguments
  const [updateState, setUpdateState] = useState<TEffectUpdateState>(() => {
    if (effect.migrationInProgress) {
      return 'UpdateInProgress'
    } else if (effect.hasIssue(ClientEffect.ISSUE_KEY_OUTDATED)) {
      return 'UpdateAvailable'
    } else {
      return 'NoUpdate'
    }
  })
  const updateEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'update',
        type: 'button',
        icon: 'update',
        label: '',
        onClick: async () => {
          try {
            let migrationPromise = effect.$migrateArguments()
            setUpdateState('UpdateInProgress')
            await migrationPromise
            setUpdateState('UpdateSucceeded')
            onChange(effect)
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
  const svgEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'copy',
        type: 'button',
        icon: 'copy',
        description: 'Duplicate effect',
        permissions: ['missions_write'],
        onClick: async () => await onDuplicateRequest(effect, true),
      },
      {
        key: 'remove',
        type: 'button',
        icon: 'remove',
        description: 'Delete effect',
        permissions: ['missions_write'],
        onClick: async () => await onDeleteRequest(effect, true),
      },
    ],
  })

  /* -- COMPUTED -- */

  let mission = effect.mission
  let hasMissingTargetIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_MISSING_TARGET,
  )
  let hasLegacyInferIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_LEGACY_INFER,
  )
  let hasOutdatedIssue = mission.issueRegistry.componentHasIssue(
    effect,
    ClientEffect.ISSUE_KEY_OUTDATED,
  )
  let targetEnvironmentName = compute<string>(() => {
    if (hasMissingTargetIssue || hasLegacyInferIssue) {
      return 'Environment not found.'
    } else if (environment) {
      return environment.name
    } else {
      return 'No target environment selected.'
    }
  })
  let targetName = compute<string>(() => {
    if (hasMissingTargetIssue || hasLegacyInferIssue) {
      return 'Target not found.'
    } else if (target) {
      return target.name
    } else {
      return 'No target selected.'
    }
  })
  let targetEnvironmentErrorMessage = compute<string>(() => {
    if (hasMissingTargetIssue || hasLegacyInferIssue) {
      return `This effect's target environment could not be found. Please reinstall/repair the corresponding target environment or delete this effect.`
    } else {
      return ''
    }
  })
  let targetErrorMessage = compute<string>(() => {
    if (hasMissingTargetIssue || hasLegacyInferIssue) {
      return `This effect's target could not be found. Please reinstall/repair the corresponding target environment or delete this effect.`
    } else {
      return ''
    }
  })
  let updateComponentClasses = new ClassList('UpdateComponent').add(updateState)

  /* -- RENDER -- */

  return (
    <Entry missionComponent={effect} svgEngines={[svgEngine]}>
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
      <DetailString
        fieldType='required'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientEffect.DEFAULT_EXEC_PROPERTIES.name}
        maxLength={ClientEffect.MAX_NAME_LENGTH}
        placeholder='Enter name...'
        disabled={viewMode === 'preview'}
      />
      <DetailDropdown<TSelectEffectContext<any>[TType]['trigger']>
        fieldType='required'
        label='Trigger'
        options={effect.host.validTriggers}
        value={trigger}
        setValue={setTrigger}
        isExpanded={false}
        render={(value) => StringToolbox.toTitleCase(value)}
        getKey={(value) => value}
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: 'execution-success',
        }}
        disabled={viewMode === 'preview'}
      />
      <DetailLargeString
        fieldType='optional'
        label='Description'
        value={description}
        setValue={setDescription}
        placeholder='Enter description...'
        disabled={viewMode === 'preview'}
      />
      <DetailLocked
        label='Target Environment'
        value={targetEnvironmentName}
        disabled={viewMode === 'preview'}
        errorType={'warning'}
        errorMessage={targetEnvironmentErrorMessage}
      />
      <DetailLocked
        label='Target'
        value={targetName}
        disabled={viewMode === 'preview'}
        errorType={'warning'}
        errorMessage={targetErrorMessage}
      />
      <TargetArgumentsEntry
        effect={effect}
        targetArguments={targetArguments}
        setTargetArguments={setTargetArguments}
      />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR EFFECT ENTRY ---------------------------- */

/**
 * Props for EffectEntry component.
 */
export type TEffectEntry_P<TType extends TEffectType> = {
  /**
   * The effect to apply to the target.
   */
  effect: TMetisClientComponents[TType]
}

/**
 * The update state of the effect, which determines whether
 * the update component is shown and what message it displays.
 */
export type TEffectUpdateState =
  | 'NoUpdate'
  | 'UpdateAvailable'
  | 'UpdateInProgress'
  | 'UpdateSucceeded'
  | 'UpdateFailed'
