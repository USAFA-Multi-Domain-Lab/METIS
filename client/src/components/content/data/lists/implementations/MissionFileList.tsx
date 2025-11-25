import type { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { useDefaultProps } from '@client/toolbox/hooks'
import { FileToolbox } from '@shared/toolbox/files/FileToolbox'
import type { TList_P } from '../List'
import List, { createDefaultListProps } from '../List'

/**
 * A component for displaying a list of mission files.
 * @note Uses the `List` component.
 */
export default function (props: TMissionFileList_P): TReactElement | null {
  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientMissionFile>(),
    itemsPerPageMin: 10,
    columns: ['mimetype', 'size'],
    deselectionBlacklist: ['.ResizeBar', '.ScrollBox', '.EntryBottom'],
    listButtonIcons: [],
    itemButtonIcons: ['unlink'],
    initialSorting: {
      method: 'column-based',
      column: 'name',
      direction: 'ascending',
    },
    getCellText: (
      file: ClientMissionFile,
      column: keyof ClientMissionFile,
    ): string => {
      switch (column) {
        case 'mimetype':
          return FileToolbox.mimeTypeToLabel(file.mimetype)
        case 'size':
          return FileToolbox.formatFileSize(file.size)
        default:
          return 'Unknown column'
      }
    },
    getListButtonLabel: (button) => {
      switch (button) {
        default:
          return ''
      }
    },
    getItemButtonLabel: (button) => {
      switch (button) {
        case 'unlink':
          return 'Detach'
        default:
          console.warn('Unknown button label requested in file list.')
          return button
      }
    },
    getColumnWidth: (column: keyof ClientMissionFile): string => {
      switch (column) {
        default:
          return '10em'
      }
    },
    onItemDblClick: (file) => props.onDetachRequest?.(file),
    onListButtonClick: (button) => {
      switch (button) {
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
    onItemButtonClick: (button, file) => {
      switch (button) {
        case 'unlink':
          props.onDetachRequest?.(file)
          break
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
    getItemButtonPermissions: (button) => {
      switch (button) {
        case 'unlink':
          return ['missions_write']
        default:
          return []
      }
    },
    onDetachRequest: () => {},
  })

  // Render the list of files.
  return <List<ClientMissionFile> {...defaultedProps} />
}

/**
 * Props for `FileList`.
 */
export interface TMissionFileList_P extends TList_P<ClientMissionFile> {
  /**
   * Callback to the parent component, requesting to
   * detach the given file from the mission.
   * @param file The file to detach.
   * @note If no callback is provided, this operation
   * will not be available in the default item-button
   * list.
   */
  onDetachRequest?: (file: ClientMissionFile) => void
}
