import { useRef } from 'react'
import Prompt from 'src/components/content/communication/Prompt'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context'
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
  /* -- STATE -- */

  const globalContext = useGlobalContext()
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
    columns: ['mimetype', 'size'],
    listButtons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      // todo: Add auth.
      // // If the user has the proper authorization, add
      // // the add and upload buttons.
      // if (login.user.isAuthorized('files_write')) {
      //   results.push('add', 'upload')
      if (props.onFileDrop) results.push('upload')
      // }

      return results
    }),
    itemButtons: compute<TButtonSvgType[]>(() => {
      let results: TButtonSvgType[] = []

      // todo: Add auth.
      // If the user is authorized, add the download
      // button.
      // if (props.user.isAuthorized('files_read')) {
      results.push('download')
      // }
      results.push('remove')

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
    getListButtonLabel: (button) => {
      switch (button) {
        case 'upload':
          return 'Upload'
        default:
          console.warn(`"${button}" button in file list does not have a label.`)
          return ''
      }
    },
    getItemButtonLabel: (button, item) => {
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
