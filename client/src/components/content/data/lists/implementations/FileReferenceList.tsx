import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import ClientFileReference from 'src/files/references'
import { compute } from 'src/toolbox'
import { useDefaultProps } from 'src/toolbox/hooks'
import FileToolbox from '../../../../../../../shared/toolbox/files'
import List, { createDefaultListProps, TList_P } from '../List'

/**
 * A component for displaying a list of file references.
 * @note Uses the `List` component.
 */
export default function (props: TFileReferenceList_P): JSX.Element | null {
  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientFileReference>(),
    itemsPerPageMin: 10,
    columns: ['mimetype', 'size'],
    listButtons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      // todo: Uncomment and resolve this.
      // // If the user has the proper authorization, add
      // // the add and upload buttons.
      // if (login.user.isAuthorized('files_write')) {
      //   results.push('add', 'upload')
      // }

      return results
    }),
    itemButtons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      // Add the open button.
      // results.push('open')

      // todo: Uncomment and resolve this.
      //     // If the user has the proper authorization, add
      //     // the launch button.
      //     if (login.user.isAuthorized('sessions_write_native')) {
      //       results.push('launch')
      //     }
      //
      //     // If the user has the proper authorization, add
      //     // the edit, remove, copy, and download buttons.
      //     if (login.user.isAuthorized('files_write')) {
      //       results.push('download', 'copy', 'remove')
      //     }

      return results
    }),
    initialSorting: { column: 'name', method: 'ascending' },
    getCellText: (
      file: ClientFileReference,
      column: keyof ClientFileReference,
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
    getListButtonTooltip: (button) => {
      switch (button) {
        default:
          return ''
      }
    },
    getItemButtonTooltip: (button, item) => {
      // Call function in the props instead,
      // if it exists, overriding the default
      // behavior.
      if (props.getItemButtonTooltip) {
        return props.getItemButtonTooltip(button, item)
      }

      switch (button) {
        default:
          return ''
      }
    },
    getColumnWidth: (column: keyof ClientFileReference): string => {
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
      // Call function in the props instead,
      // if it exists, overriding the default
      // behavior.
      if (props.onItemButtonClick) {
        return props.onItemButtonClick(button, file)
      }
      switch (button) {
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
  })

  // Render the list of files.
  return <List<ClientFileReference> {...defaultedProps} />
}

/**
 * Props for `FileList`.
 */
export interface TFileReferenceList_P extends TList_P<ClientFileReference> {}
