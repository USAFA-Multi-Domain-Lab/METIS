import Divider from '@client/components/content/form/Divider'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import If from '@client/components/content/util/If'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useGlobalContext } from '@client/context/global'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientEffect } from '@client/missions/effects/ClientEffect'
import { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import {
  useMountHandler,
  usePostInitEffect,
  useRequireLogin,
  useUnmountHandler,
} from '@client/toolbox/hooks'
import type { TMissionComponentDefect } from '@shared/missions/MissionComponent'
import { useRef, useState } from 'react'
import Tooltip from '../../../../content/communication/Tooltip'
import { DetailString } from '../../../../content/form/DetailString'
import ListOld from '../../../../content/general-layout/ListOld'
import { EffectTimeline } from '../../target-effects/timelines'
import Entry from '../Entry'

/**
 * The amount of time between checks for
 * defective components in the mission.
 */
const DEFECT_INTERVAL_TIME = 1000 // ms

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
}: TMissionEntry_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { prompt } = globalContext.actions
  const { login } = useRequireLogin()
  const { user } = login
  const { state, onChange, viewMode } = useMissionPageContext()
  const [checkForDefects, setCheckForDefects] = state.checkForDefects
  const [defects, setDefects] = state.defects
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )
  const warningButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'warning-transparent',
        type: 'button',
        icon: 'warning-transparent',
        cursor: 'help',
        description:
          'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
      },
    ],
  })
  const defectTimeout = useRef<number | undefined>(undefined)

  /* -- EFFECTS -- */

  // Create an interval to check for defective components
  // within the mission.
  useMountHandler(() => {
    const callback = () => {
      // Every interval, if flagged to recheck
      // for defects, update the state to the
      // defects in the mission, which is a computed
      //  property.
      if (checkForDefects) {
        setDefects(mission.defects)
        setCheckForDefects(false)
      }
    }

    defectTimeout.current = window.setInterval(callback, DEFECT_INTERVAL_TIME)
    callback() // Initial check
  }, [])
  useUnmountHandler(() => clearInterval(defectTimeout.current))

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the mission resource label.
    mission.resourceLabel = resourceLabel

    // Allow the user to save the changes.
    onChange(mission)
  }, [name, resourceLabel])

  /* -- FUNCTIONS -- */

  const onDefectSelection = async (defect: TMissionComponentDefect) => {
    const { type, component } = defect

    if (component instanceof ClientEffect && type === 'outdated') {
      let { choice } = await prompt(
        'Would you like to attempt an update on this effect to make it compatible with the currently installed target-environment version?',
        ['Update', 'Cancel'],
      )

      // Abort, if the user cancels.
      if (choice === 'Cancel') return

      // Call the API to migrate the effect arguments.
      let results = await ClientTargetEnvironment.$migrateEffectArgs(component)

      // Store the migrated data in the component.
      component.targetEnvironmentVersion = results.resultingVersion
      component.args = results.resultingArgs

      onChange(component)
    } else {
      mission.select(component)

      // If configured, pan to the node associated
      // with the defect, assuming there is one.
      if (user.preferences.missionMap.panOnDefectSelection) {
        mission.requestFocusOnMap(component)
      }
    }
  }

  /* -- RENDER -- */

  /**
   * Renders JSX for a defect in the mission.
   */
  const renderDefect = (defect: TMissionComponentDefect) => {
    // Extract defect properties.
    const { component, message } = defect

    return (
      <div className='Row IconFirst' key={`object-row-${component._id}`}>
        <ButtonSvgPanel engine={warningButtonEngine} />
        <div
          className='RowContent Select'
          onClick={() => onDefectSelection(defect)}
        >
          {message}
          <Tooltip description='Click to resolve.' />
        </div>
      </div>
    )
  }

  /* -- RENDER -- */
  return (
    <Entry missionComponent={mission}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
        maxLength={ClientMission.MAX_NAME_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_name`}
      />
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Resource Label'
        value={resourceLabel}
        setValue={setResourceLabel}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.resourceLabel}
        maxLength={ClientMission.MAX_RESOURCE_LABEL_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_resourceLabel`}
      />
      <Divider />
      <EffectTimeline<'sessionTriggeredEffect'> host={mission} />
      <Divider />
      <If condition={defects.length}>
        <ListOld<TMissionComponentDefect>
          items={defects}
          renderItemDisplay={(object) => renderDefect(object)}
          headingText={'Unresolved Defects'}
          alwaysUseBlanks={false}
          searchableProperties={['message']}
          noItemsDisplay={null}
          ajaxStatus={'Loaded'}
          applyItemStyling={() => {
            return {}
          }}
          itemsPerPage={null}
          listSpecificItemClassName='AltDesign2'
        />
      </If>
    </Entry>
  )
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

/**
 * The props for the `MissionEntry` component.
 */
type TMissionEntry_P = {
  /**
   * The mission to be edited.
   */
  mission: ClientMission
}
