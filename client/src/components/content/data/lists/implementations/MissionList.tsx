import { useRef } from 'react'
import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { useDefaultProps, useRequireLogin } from 'src/toolbox/hooks'
import { DateToolbox } from '../../../../../../../shared/toolbox/dates'
import List, { createDefaultListProps, TList_P } from '../List'
import { TOnItemSelection } from '../pages/ListItem'

// todo: Convert this list to be organized
// todo like `FileReferenceList`.
/**
 * A component for displaying a list of missions.
 * @note Uses the `List` component.
 */
export default function MissionList(props: TMissionList_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { login } = useRequireLogin()
  const { notify, beginLoading, finishLoading, navigateTo, prompt } =
    globalContext.actions
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to delete a mission.
   */
  const onDeleteRequest = async (mission: ClientMission) => {
    const { onSuccessfulDeletion } = defaultedProps

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
    const { onSuccessfulCopy } = defaultedProps

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
   * Handles a change to the import mission trigger.
   */
  const onImportTriggerChange = (): void => {
    const { onFileDrop } = defaultedProps
    let importMissionTrigger_elm: HTMLInputElement | null =
      importMissionTrigger.current

    // Abort, if no file-drop callback is provided.
    if (!onFileDrop) return

    // If files are found, upload
    // is begun.
    if (
      importMissionTrigger_elm &&
      importMissionTrigger_elm.files !== null &&
      importMissionTrigger_elm.files.length > 0
    ) {
      onFileDrop(importMissionTrigger_elm.files)
    }
  }

  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientMission>(),
    itemsPerPageMin: 10,
    columns: ['createdAt', 'updatedAt', 'launchedAt', 'creatorFullName'],
    listButtons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      // If the user has the proper authorization, add
      // the add and upload buttons.
      if (login.user.isAuthorized('missions_write')) {
        results.push('add', 'upload')
      }

      return results
    }),
    itemButtons: compute<TButtonSvgType[]>(() => {
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
    }),
    initialSorting: { column: 'updatedAt', method: 'descending' },
    getColumnLabel: (column: keyof ClientMission): string => {
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
    },
    getCellText: (
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
    },
    getListButtonLabel: (button) => {
      switch (button) {
        case 'add':
          return 'New mission'
        case 'upload':
          return 'Import from .metis file'
        default:
          return ''
      }
    },
    getItemButtonLabel: (button, item) => {
      switch (button) {
        case 'open':
          if (login.user.isAuthorized('missions_write')) return 'View/edit'
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
    },
    getColumnWidth: (column: keyof ClientMission): string => {
      switch (column) {
        case 'createdAt':
        case 'updatedAt':
        case 'launchedAt':
          return '9em'
        default:
          return '10em'
      }
    },
    onListButtonClick: (button) => {
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
    },
    onItemButtonClick: (button, mission) => {
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
          console.log(
            `/api/v1/missions/${mission._id}/export/${mission.fileName}`,
          )
          window.open(
            `/api/v1/missions/${mission._id}/export/${mission.fileName}`,
            '_blank',
          )
          break
        default:
          console.warn('Unknown button clicked in mission list.')
          break
      }
    },
    onSuccessfulDeletion: () => {},
    onSuccessfulCopy: () => {},
  })

  // Render the list of missions.
  return (
    <>
      <List<ClientMission> {...defaultedProps} />
      <If condition={defaultedProps.onFileDrop}>
        <input
          className='ImportMissionTrigger'
          type='file'
          ref={importMissionTrigger}
          onChange={onImportTriggerChange}
          hidden
        />
      </If>
    </>
  )
}

/**
 * Props for `MissionList`.
 */
export interface TMissionList_P extends TList_P<ClientMission> {
  /**
   * Callback for a successful copy event.
   * @param resultingMission The resulting mission from
   * the copy event.
   * @default () => {}
   */
  onSuccessfulCopy?: (resultingMission: ClientMission) => void
  /**
   * Callback for a successful deletion event.
   * @param deletedMission The deleted mission.
   * @default () => {}
   */
  onSuccessfulDeletion?: (deletedMission: ClientMission) => void
}
