import { useRef, useState } from 'react'
import Prompt from 'src/components/content/communication/Prompt'
import ButtonSvgPanel from 'src/components/content/user-controls/buttons/v3/ButtonSvgPanel'
import { useButtonSvgEngine } from 'src/components/content/user-controls/buttons/v3/hooks'
import { useMissionPageContext } from 'src/components/pages/MissionPage'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import {
  useMountHandler,
  usePostInitEffect,
  useUnmountHandler,
} from 'src/toolbox/hooks'
import MissionComponent from '../../../../../../../shared/missions/component'
import Tooltip from '../../../communication/Tooltip'
import { DetailString } from '../../../form/DetailString'
import ListOld, { ESortByMethod } from '../../../general-layout/ListOld'
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
  onChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { notify, beginLoading, finishLoading, navigateTo, prompt } =
    globalContext.actions

  const { state, missionPageSvgEngine } = useMissionPageContext()
  const [checkForDefects, setCheckForDefects] = state.checkForDefects
  const [defectiveComponents, setDefectiveComponents] =
    state.defectiveComponents
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )
  const warningButtonEngine = useButtonSvgEngine({
    elements: [
      {
        type: 'button',
        icon: 'warning-transparent',
        cursor: 'help',
        description:
          'If this conflict is not resolved, this mission can still be used to launch a session, but the session may not function as expected.',
      },
    ],
  })
  const entrySvgEngine = useButtonSvgEngine({
    elements: [
      {
        type: 'button',
        icon: 'copy',
        description: 'Duplicate',
        permissions: ['missions_write'],
        onClick: async () => await onCopyRequest(),
      },
      {
        type: 'button',
        icon: 'download',
        description: 'Export to .metis file',
        permissions: ['missions_write'],
        onClick: () => onExportRequest(),
      },
      {
        type: 'button',
        icon: 'remove',
        description: 'Delete',
        disabled: !mission.existsOnServer,
        permissions: ['missions_write'],
        onClick: async () => await onDeleteRequest(),
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
      // defective components in the mission, which
      // is a computed property.
      if (checkForDefects) {
        setDefectiveComponents(mission.defectiveComponents)
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

  /**
   * Renders JSX for the effect list item.
   */
  const renderObjectListItem = (component: MissionComponent<any, any>) => {
    return (
      <div className='Row IconFirst' key={`object-row-${component._id}`}>
        <ButtonSvgPanel engine={warningButtonEngine} />
        <div
          className='RowContent Select'
          onClick={() => mission.select(component)}
        >
          {component.defectiveMessage}
          <Tooltip description='Click to resolve.' />
        </div>
      </div>
    )
  }

  /**
   * Handles a request to copy a mission.
   */
  const onCopyRequest = async () => {
    let { choice, text } = await prompt(
      'Enter the name of the new mission',
      ['Cancel', 'Submit'],
      {
        textField: { boundChoices: ['Submit'], label: 'Name' },
        defaultChoice: 'Submit',
      },
    )

    // If the user confirms the copy, proceed.
    if (choice === 'Submit') {
      try {
        beginLoading('Copying mission...')
        let resultingMission = await ClientMission.$copy(mission._id, text)
        notify(`Successfully copied "${mission.name}".`)
        finishLoading()

        let { choice } = await prompt(
          'Would you like to open the copied mission?',
          Prompt.ConfirmationChoices,
        )
        if (choice === 'Confirm') {
          navigateTo('MissionPage', {
            missionId: resultingMission._id,
          })
        }
      } catch (error) {
        finishLoading()
        notify(`Failed to copy "${mission.name}".`)
      }
    }
  }

  /**
   * Handles a request to delete a mission.
   */
  const onDeleteRequest = async () => {
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Please confirm the deletion of this mission.',
      Prompt.ConfirmationChoices,
    )

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting mission...')
        await ClientMission.$delete(mission._id)
        finishLoading()
        notify(`Successfully deleted "${mission.name}".`)
        navigateTo('HomePage', {})
      } catch (error) {
        finishLoading()
        notify(`Failed to delete "${mission.name}".`)
      }
    }
  }

  /**
   * Handles a request to export the mission.
   */
  const onExportRequest = () => {
    console.log(`/api/v1/missions/${mission._id}/export/${mission.fileName}`)
    window.open(
      `/api/v1/missions/${mission._id}/export/${mission.fileName}`,
      '_blank',
    )
  }

  /* -- RENDER -- */
  return (
    <Entry
      missionComponent={mission}
      svgEngines={[missionPageSvgEngine, entrySvgEngine]}
    >
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
        maxLength={ClientMission.MAX_NAME_LENGTH}
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
        key={`${mission._id}_resourceLabel`}
      />
      {defectiveComponents.length > 0 ? (
        <ListOld<MissionComponent<any, any>>
          items={defectiveComponents}
          renderItemDisplay={(object) => renderObjectListItem(object)}
          headingText={'Unresolved Conflicts'}
          sortByMethods={[ESortByMethod.Name]}
          nameProperty={'name'}
          alwaysUseBlanks={false}
          searchableProperties={['name']}
          noItemsDisplay={null}
          ajaxStatus={'Loaded'}
          applyItemStyling={() => {
            return {}
          }}
          itemsPerPage={null}
          listSpecificItemClassName='AltDesign2'
        />
      ) : null}
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
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   * @param mission The same mission that was passed.
   */
  onChange: (mission: ClientMission) => void
}
