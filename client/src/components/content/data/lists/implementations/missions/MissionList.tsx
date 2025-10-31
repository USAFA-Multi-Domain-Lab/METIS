import { useRef } from 'react'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context/global'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { useDefaultProps, useRequireLogin } from 'src/toolbox/hooks'
import { DateToolbox } from '../../../../../../../../shared/toolbox/dates'
import List, { createDefaultListProps, TList_P } from '../../List'
import { useMissionItemButtonCallbacks } from './item-buttons'

/**
 * A component for displaying a list of missions.
 * @note Uses the `List` component.
 */
export default function MissionList(
  props: TMissionList_P,
): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { login } = useRequireLogin()
  const { navigateTo } = globalContext.actions
  const importMissionTrigger = useRef<HTMLInputElement>(null)

  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientMission>(),
    itemsPerPageMin: 10,
    columns: ['createdAt', 'updatedAt', 'launchedAt', 'createdByUsername'],
    listButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []

      // If the user has the proper authorization, add
      // the add and upload buttons.
      if (login.user.isAuthorized('missions_write')) {
        results.push('add', 'upload')
      }

      return results
    }),
    itemButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []

      // Add the open button.
      results.push('open')

      // If the user has the proper authorization, add
      // the launch button.
      if (login.user.isAuthorized('sessions_write_native')) {
        results.push('play')
        results.push('launch')
      }

      // If the user has the proper authorization, add
      // the edit, remove, copy, and download buttons.
      if (login.user.isAuthorized('missions_write')) {
        results.push('download', 'copy', 'remove')
      }

      return results
    }),
    initialSorting: {
      method: 'column-based',
      column: 'updatedAt',
      direction: 'descending',
    },
    getColumnLabel: (column: keyof ClientMission): string => {
      switch (column) {
        case 'createdAt':
          return 'Created'
        case 'updatedAt':
          return 'Last Modified'
        case 'launchedAt':
          return 'Last Launched'
        case 'createdByUsername':
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
        case 'createdByUsername':
          return mission.createdByUsername || 'Unknown User'
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
    getItemButtonLabel: (button) => {
      switch (button) {
        case 'open':
          if (login.user.isAuthorized('missions_write'))
            return 'View/edit mission'
          else if (login.user.isAuthorized('missions_read'))
            return 'View mission'
          else return ''
        case 'play':
          return 'Play-test mission'
        case 'launch':
          return 'Launch mission into a session'
        case 'copy':
          return 'Duplicate mission'
        case 'download':
          return 'Export mission to .metis file'
        case 'remove':
          return 'Delete mission'
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
    onItemDblClick: (mission) => onOpenRequest(mission),
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
        case 'play':
          onPlayTestRequest(mission, 'HomePage')
          break
        case 'launch':
          onLaunchRequest(mission, 'HomePage')
          break
        case 'copy':
          onCopyRequest(mission)
          break
        case 'remove':
          onDeleteRequest(mission)
          break
        case 'download':
          onExportRequest(mission)
          break
        default:
          console.warn('Unknown button clicked in mission list.')
          break
      }
    },
    onSuccessfulDeletion: () => {},
    onSuccessfulCopy: () => {},
    onFileDrop: async (incomingFiles: FileList) => {},
  })
  const { onSuccessfulCopy, onSuccessfulDeletion } = defaultedProps

  /* -- FUNCTIONS -- */

  // Callbacks for item buttons.
  const {
    onOpenRequest,
    onPlayTestRequest,
    onLaunchRequest,
    onCopyRequest,
    onDeleteRequest,
    onExportRequest,
  } = useMissionItemButtonCallbacks({
    onSuccessfulCopy,
    onSuccessfulDeletion,
  })

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
