import { useRef } from 'react'
import Prompt from 'src/components/content/communication/Prompt'

import If from 'src/components/content/util/If'
import { useGlobalContext } from 'src/context/global'
import ClientFileReference from 'src/files/references'
import { useDefaultProps } from 'src/toolbox/hooks'
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
  const { prompt, notify, beginLoading, finishLoading, handleError } =
    globalContext.actions
  const importFileTrigger = useRef<HTMLInputElement>(null)
  const [files, setFiles] = props.files

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
    listButtonIcons: ['upload'],
    itemButtonIcons: ['download', 'remove'],
    initialSorting: { column: 'name', method: 'ascending' },
    getListButtonPermissions: (button) => {
      switch (button) {
        case 'upload':
          return ['files_write']
        default:
          return []
      }
    },
    getItemButtonPermissions: (button) => {
      switch (button) {
        case 'remove':
          return ['files_write']
        default:
          return []
      }
    },
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
    onItemDblClick: (item) => item.download(),
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
    onFileDrop: async (incomingFiles: FileList) => {
      // Switch to load screen.
      beginLoading(
        `Importing ${incomingFiles.length} file${
          incomingFiles.length === 1 ? '' : 's'
        }...`,
      )

      // Import the files.
      try {
        let references = await ClientFileReference.$upload(incomingFiles)
        setFiles([...files, ...references])
        finishLoading()
        notify(
          `Successfully imported ${references.length} file${
            references.length === 1 ? '' : 's'
          }.`,
        )
      } catch (error: any) {
        finishLoading()
        handleError({
          message: `Failed to upload files to file store.`,
          notifyMethod: 'bubble',
        })
      }
    },
  })

  /* -- RENDER -- */

  // Render the list of files.
  return (
    <>
      <List<ClientFileReference> {...defaultedProps} items={files} />
      <If condition={props.onFileDrop || defaultedProps.onFileDrop}>
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
export interface TFileReferenceList_P
  extends Omit<TList_P<ClientFileReference>, 'items'> {
  /**
   * The list of file references to display.
   */
  files: TReactState<ClientFileReference[]>
  /**
   * Callback for a successful deletion event.
   * @param reference The deleted reference.
   * @default () => {}
   */
  onSuccessfulDeletion?: (reference: ClientFileReference) => void
}
