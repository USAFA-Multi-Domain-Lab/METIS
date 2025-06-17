import ClientMissionFile from 'src/missions/files'
import { compute } from 'src/toolbox'
import { useDefaultProps } from 'src/toolbox/hooks'
import FileToolbox from '../../../../../../../shared/toolbox/files'
import List, { createDefaultListProps, TList_P } from '../List'

/**
 * A component for displaying a list of mission files.
 * @note Uses the `List` component.
 */
export default function (props: TMissionFileList_P): JSX.Element | null {
  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientMissionFile>(),
    itemsPerPageMin: 10,
    columns: ['mimetype', 'size'],
    listButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []

      // todo: Uncomment and resolve this.
      // // If the user has the proper authorization, add
      // // the add and upload buttons.
      // if (login.user.isAuthorized('files_write')) {
      //   results.push('add', 'upload')
      // }

      return results
    }),
    itemButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []

      // todo: Add auth.
      if (props.onDetachRequest) results.push('divider')

      return results
    }),
    initialSorting: { column: 'name', method: 'ascending' },
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
        case 'divider':
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
    onListButtonClick: (button) => {
      switch (button) {
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
    onItemButtonClick: (button, file) => {
      switch (button) {
        case 'divider':
          console.log('hello')
          props.onDetachRequest?.(file)
          break
        default:
          console.warn('Unknown button clicked in file list.')
          break
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
