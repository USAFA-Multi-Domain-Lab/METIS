import { useRef } from 'react'
import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import { DateToolbox } from '../../../../../../../shared/toolbox/dates'
import List, { TGetListButtonTooltip } from '../List'
import {
  TGetItemButtonTooltip,
  TOnItemButtonClick,
  TOnItemSelection,
} from '../pages/ListItem'

/**
 * A component for displaying a list of missions.
 * @note Uses the `List` component.
 */
export default function MissionList({
  missions,
  onSuccessfulDeletion,
  onSuccessfulCopy,
  importMissionFiles,
}: TMissionList_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [login] = useRequireLogin()
  const { notify, beginLoading, finishLoading, navigateTo, prompt } =
    globalContext.actions
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPUTED -- */

  /**
   * The list buttons to display based on permissions.
   */
  const listButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // If the user has the proper authorization, add
    // the add and upload buttons.
    if (login.user.isAuthorized('missions_write')) {
      results.push('add', 'upload')
    }

    return results
  })

  /**
   * The item buttons to display based on permissions.
   */
  const itemButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // Add the open button.
    results.push('open')

    // If the user has the proper authorization, add
    // the launch button.
    if (login.user.isAuthorized('sessions_write_native')) {
      results.push('launch')
    }

    // If the user has the proper authorization, add
    // the edit, remove, copy, and download buttons.
    if (login.user.isAuthorized('missions_write')) {
      results.push('download', 'copy', 'remove')
    }

    return results
  })

  /**
   * The tooltip description for the open button.
   */
  const tooltipDescription = compute<string>(() =>
    login.user.isAuthorized('missions_write')
      ? 'Open mission'
      : 'Launch session',
  )

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to delete a mission.
   */
  const onDeleteRequest = async (mission: ClientMission) => {
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
        onSuccessfulDeletion(mission)
      } catch (error) {
        finishLoading()
        notify(`Failed to delete "${mission.name}".`)
      }
    }
  }

  /**
   * Handles a request to copy a mission.
   */
  const onCopyRequest = async (mission: ClientMission) => {
    let { choice, text } = await prompt(
      'Enter the name of the new mission:',
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
        onSuccessfulCopy(resultingMission)
      } catch (error) {
        finishLoading()
        notify(`Failed to copy "${mission.name}".`)
      }
    }
  }

  /**
   * Handles a request to launch a new session from a mission.
   */
  const onLaunchRequest = (mission: ClientMission) => {
    navigateTo('LaunchPage', { missionId: mission._id })
  }

  /**
   * Opens the mission for editing or viewing.
   * @param mission The mission to open.
   */
  const onOpenRequest = ({ _id: missionId }: ClientMission): void => {
    if (
      login.user.isAuthorized('missions_write') ||
      login.user.isAuthorized('missions_read')
    ) {
      navigateTo('MissionPage', { missionId })
    }
  }

  /**
   * Gets the column label for a mission list.
   * @param column The column for which to get the label.
   * @returns The label for the column.
   */
  const getMissionColumnLabel = (column: keyof ClientMission): string => {
    switch (column) {
      case 'createdAt':
        return 'Created'
      case 'updatedAt':
        return 'Last Modified'
      case 'launchedAt':
        return 'Last Launched'
      case 'creatorFullName':
        return 'Created By'
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the text for a mission list cell.
   * @param mission The mission for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   */
  const getMissionCellText = (
    mission: ClientMission,
    column: keyof ClientMission,
  ): string => {
    switch (column) {
      case 'createdAt':
      case 'updatedAt':
      case 'launchedAt':
        let datetime = mission[column]
        if (datetime === null) return 'N/A'
        else return DateToolbox.format(datetime, 'yyyy-mm-dd HH:MM')
      case 'creatorFullName':
        return mission.creatorFullName
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the tooltip description for a mission list button.
   */
  const getMissionListButtonTooltip: TGetListButtonTooltip = (button) => {
    switch (button) {
      case 'add':
        return 'New mission'
      case 'upload':
        return 'Import from .metis file'
      default:
        return ''
    }
  }

  /**
   * Gets the tooltip description for a mission item button.
   */
  const getMissionItemButtonTooltip: TGetItemButtonTooltip<ClientMission> = (
    button,
    item,
  ) => {
    switch (button) {
      case 'open':
        if (login.user.isAuthorized('missions_write')) return 'Open'
        else if (login.user.isAuthorized('missions_read')) return 'View'
        else return ''
      case 'launch':
        return 'Launch session'
      case 'copy':
        return 'Duplicate'
      case 'download':
        return 'Export to .metis file'
      case 'remove':
        return 'Delete'
      default:
        return ''
    }
  }

  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   */
  const getMissionColumnWidth = (column: keyof ClientMission): string => {
    switch (column) {
      case 'createdAt':
      case 'updatedAt':
      case 'launchedAt':
        return '9em'
      default:
        return '10em'
    }
  }

  /**
   * Handler for when a mission is selected.
   */
  const onMissionSelection: TOnItemSelection<ClientMission> = async ({
    _id: missionId,
  }) => {
    if (login.user.isAuthorized('missions_write')) {
      navigateTo('MissionPage', { missionId })
    } else if (login.user.isAuthorized('sessions_write_native')) {
      navigateTo('LaunchPage', { missionId })
    }
  }

  /**
   * Callback for when a list-specific button in the
   * mission list is clicked.
   */
  const onMissionListButtonClick: TSvgPanelOnClick = (button) => {
    switch (button) {
      case 'add':
        if (login.user.isAuthorized('missions_write')) {
          navigateTo('MissionPage', { missionId: null })
        }
        break
      case 'upload':
        let importMissionTrigger_elm: HTMLInputElement | null =
          importMissionTrigger.current

        if (importMissionTrigger_elm) {
          importMissionTrigger_elm.click()
        }
        break
      default:
        console.warn('Unknown button clicked in mission list.')
        break
    }
  }

  /**
   * Callback for when a item-specific button in the
   * mission list is clicked.
   */
  const onMissionItemButtonClick: TOnItemButtonClick<ClientMission> = (
    button,
    mission,
  ) => {
    switch (button) {
      case 'open':
        onOpenRequest(mission)
        break
      case 'launch':
        onLaunchRequest(mission)
        break
      case 'copy':
        onCopyRequest(mission)
        break
      case 'remove':
        onDeleteRequest(mission)
        break
      case 'download':
        window.open(
          `/api/v1/missions/${mission._id}/export/${mission.fileName}`,
          '_blank',
        )
        break
      default:
        console.warn('Unknown button clicked in mission list.')
        break
    }
  }

  // This is called when a change is made
  // to the mission import input element.
  const onImportTriggerChange = (): void => {
    let importMissionTrigger_elm: HTMLInputElement | null =
      importMissionTrigger.current

    // If files are found, upload
    // is begun.
    if (
      importMissionTrigger_elm &&
      importMissionTrigger_elm.files !== null &&
      importMissionTrigger_elm.files.length > 0
    ) {
      importMissionFiles(importMissionTrigger_elm.files)
    }
  }

  // Render the list of missions.
  return (
    <>
      <List<ClientMission>
        name={'Missions'}
        items={missions}
        columns={['createdAt', 'updatedAt', 'launchedAt', 'creatorFullName']}
        listButtons={listButtons}
        itemButtons={itemButtons}
        initialSorting={{ column: 'updatedAt', method: 'descending' }}
        getItemTooltip={() => tooltipDescription}
        getColumnLabel={getMissionColumnLabel}
        getCellText={getMissionCellText}
        getListButtonTooltip={getMissionListButtonTooltip}
        getItemButtonTooltip={getMissionItemButtonTooltip}
        getColumnWidth={getMissionColumnWidth}
        onSelection={onMissionSelection}
        onListButtonClick={onMissionListButtonClick}
        onItemButtonClick={onMissionItemButtonClick}
      />
      <input
        className='ImportMissionTrigger'
        type='file'
        ref={importMissionTrigger}
        onChange={onImportTriggerChange}
        hidden
      />
    </>
  )
}

/**
 * Props for `MissionList`.
 */
export type TMissionList_P = {
  /**
   * The missions to display.
   */
  missions: ClientMission[]
  /**
   * Callback for a successful copy event.
   * @param resultingMission The resulting mission from the copy event.
   */
  onSuccessfulCopy: (resultingMission: ClientMission) => void
  /**
   * Callback for a successful deletion event.
   * @param deletedMission The deleted mission.
   */
  onSuccessfulDeletion: (deletedMission: ClientMission) => void
  /**
   * Callback to import mission files.
   * @param files The files to import.
   */
  importMissionFiles: (files: FileList) => void
}
