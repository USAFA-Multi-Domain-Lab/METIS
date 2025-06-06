import { useRef } from 'react'
import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context/global'
import ClientFileReference from 'src/files/references'
import { compute } from 'src/toolbox'
import { useDefaultProps, useRequireLogin } from 'src/toolbox/hooks'
import { DateToolbox } from '../../../../../../../shared/toolbox/dates'
import FileToolbox from '../../../../../../../shared/toolbox/files'
import List, { createDefaultListProps, TList_P } from '../List'

/**
 * A component for displaying a list of file references.
 * @note Uses the `List` component.
 */
export default function (props: TFileReferenceList_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { authorize } = useRequireLogin()
  const { prompt, notify, beginLoading, finishLoading } = globalContext.actions
  const importFileTrigger = useRef<HTMLInputElement>(null)

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to delete a file reference.
   */
  const onDeleteRequest = async (reference: ClientFileReference) => {
    const { onSuccessfulDeletion } = defaultedProps
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Please confirm the deletion of this file.',
      Prompt.ConfirmationChoices,
    )

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting file...')
        await ClientFileReference.$delete(reference._id)
        finishLoading()
        notify(`Successfully deleted "${reference.name}".`)
        onSuccessfulDeletion(reference)
      } catch (error) {
        finishLoading()
        notify(`Failed to delete "${reference.name}".`)
      }
    }
  }

  /**
   * Handles a change to the import file trigger.
   */
  const onImportTriggerChange = (): void => {
    const { onFileDrop } = defaultedProps
    let importFileTrigger_elm: HTMLInputElement | null =
      importFileTrigger.current

    // Abort, if no file-drop callback is provided.
    if (!onFileDrop) return

    // If files are found, upload is begun.
    if (
      importFileTrigger_elm &&
      importFileTrigger_elm.files !== null &&
      importFileTrigger_elm.files.length > 0
    ) {
      onFileDrop(importFileTrigger_elm.files)
    }
  }

  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientFileReference>(),
    itemsPerPageMin: 10,
    columns: [
      'mimetype',
      'size',
      'createdAt',
      'updatedAt',
      'createdByUsername',
    ],
    listButtonIcons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []
      authorize('files_write', () => results.push('upload'))
      return results
    }),
    itemButtonIcons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      results.push('download')
      authorize('files_write', () => results.push('remove'))

      return results
    }),
    initialSorting: { column: 'name', method: 'ascending' },
    getColumnLabel: (column) => {
      switch (column) {
        case 'mimetype':
          return 'Type'
        case 'size':
          return 'Size'
        case 'createdAt':
          return 'Uploaded'
        case 'createdByUsername':
          return 'Uploaded By'
        case 'updatedAt':
          return 'Last Modified'
        default:
          return 'Unknown column'
      }
    },
    getCellText: (
      file: ClientFileReference,
      column: keyof ClientFileReference,
    ): string => {
      switch (column) {
        case 'mimetype':
          return FileToolbox.mimeTypeToLabel(file.mimetype)
        case 'size':
          return FileToolbox.formatFileSize(file.size)
        case 'createdAt':
        case 'updatedAt':
          let datetime = file[column]
          if (file.deleted) return 'N/A'
          else return DateToolbox.format(datetime, 'yyyy-mm-dd HH:MM')
        default:
          return file[column].toString()
      }
    },
    getListButtonLabel: (button) => {
      switch (button) {
        case 'upload':
          return 'Upload'
        default:
          console.warn(`"${button}" button in file list does not have a label.`)
          return ''
      }
    },
    getItemButtonLabel: (button) => {
      switch (button) {
        case 'download':
          return 'Download'
        case 'remove':
          return 'Delete'
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
        case 'upload':
          let importFileTrigger_elm: HTMLInputElement | null =
            importFileTrigger.current

          if (importFileTrigger_elm) {
            importFileTrigger_elm.click()
          }
          break
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
    onItemButtonClick: (button, item) => {
      switch (button) {
        case 'download':
          item.download()
          break
        case 'remove':
          onDeleteRequest(item)
          break
        default:
          console.warn('Unknown button clicked in file list.')
          break
      }
    },
    onSuccessfulDeletion: () => {},
  })

  /* -- RENDER -- */

  // Render the list of files.
  return (
    <>
      <List<ClientFileReference> {...defaultedProps} />
      <If condition={props.onFileDrop}>
        <input
          className='ImportFileTrigger'
          type='file'
          ref={importFileTrigger}
          onChange={onImportTriggerChange}
          hidden
        />
      </If>
    </>
  )
}

/**
 * Props for `FileList`.
 */
export interface TFileReferenceList_P extends TList_P<ClientFileReference> {
  /**
   * Callback for a successful deletion event.
   * @param reference The deleted reference.
   * @default () => {}
   */
  onSuccessfulDeletion?: (reference: ClientFileReference) => void
}
