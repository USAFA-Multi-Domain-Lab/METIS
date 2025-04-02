import { useRef } from 'react'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TSvgPanelOnClick } from 'src/components/content/user-controls/buttons/ButtonSvgPanel_v2'
import { useGlobalContext } from 'src/context'
import ClientFileReference from 'src/files/references'
import { compute } from 'src/toolbox'
import List, { TGetListButtonTooltip } from '../List'
import {
  TGetItemButtonTooltip,
  TOnItemButtonClick,
  TOnItemSelection,
} from '../pages/ListItem'

/**
 * A component for displaying a list of file references.
 * @note Uses the `List` component.
 */
export default function ({ files }: TFileReferenceList_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  // todo: Uncomment and resolve this.
  // const { login } = useRequireLogin()
  // const { notify, beginLoading, finishLoading, navigateTo, prompt } =
  //   globalContext.actions
  const importFileTrigger = useRef<HTMLInputElement>(null)

  /* -- COMPUTED -- */

  /**
   * The list buttons to display based on permissions.
   */
  const listButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // todo: Uncomment and resolve this.
    // // If the user has the proper authorization, add
    // // the add and upload buttons.
    // if (login.user.isAuthorized('files_write')) {
    //   results.push('add', 'upload')
    // }

    return results
  })

  /**
   * The item buttons to display based on permissions.
   */
  const itemButtons = compute<TButtonSvgType[]>(() => {
    let results: TButtonSvgType[] = []

    // Add the open button.
    results.push('open')

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
  })

  /**
   * The tooltip description for the open button.
   */
  const tooltipDescription = compute<string>(() => 'View file.')

  /* -- FUNCTIONS -- */

  /**
   * Opens the file for viewing.
   * @param file The file to open.
   */
  const onOpenRequest = (file: ClientFileReference): void => {
    // todo: Implement this.
  }

  /**
   * Gets the column label for a file list.
   * @param column The column for which to get the label.
   * @returns The label for the column.
   */
  const getFileColumnLabel = (column: keyof ClientFileReference): string => {
    switch (column) {
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the text for a file list cell.
   * @param file The file for which to get the text.
   * @param column The column for which to get the text.
   * @returns The text to display in the cell.
   */
  const getFileCellText = (
    file: ClientFileReference,
    column: keyof ClientFileReference,
  ): string => {
    switch (column) {
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the tooltip description for a file list button.
   */
  const getFileListButtonTooltip: TGetListButtonTooltip = (button) => {
    switch (button) {
      default:
        return ''
    }
  }

  /**
   * Gets the tooltip description for a file item button.
   */
  const getFileItemButtonTooltip: TGetItemButtonTooltip<ClientFileReference> = (
    button,
    item,
  ) => {
    switch (button) {
      default:
        return ''
    }
  }

  /**
   * Gets the width of the given column.
   * @param column The column for which to get the width.
   * @returns The width of the column.
   */
  const getFileColumnWidth = (column: keyof ClientFileReference): string => {
    switch (column) {
      default:
        return '10em'
    }
  }

  /**
   * Handler for when a file is selected.
   */
  const onFileSelection: TOnItemSelection<ClientFileReference> = async ({
    _id,
  }) => {
    // todo: Implement this.
  }

  /**
   * Callback for when a list-specific button in the
   * file list is clicked.
   */
  const onFileListButtonClick: TSvgPanelOnClick = (button) => {
    switch (button) {
      default:
        console.warn('Unknown button clicked in file list.')
        break
    }
  }

  /**
   * Callback for when a item-specific button in the
   * file list is clicked.
   */
  const onFileItemButtonClick: TOnItemButtonClick<ClientFileReference> = (
    button,
    file,
  ) => {
    switch (button) {
      default:
        console.warn('Unknown button clicked in file list.')
        break
    }
  }

  // This is called when a change is made
  // to the file import input element.
  const onImportTriggerChange = (): void => {
    let importFileTrigger_elm: HTMLInputElement | null =
      importFileTrigger.current

    // If files are found, upload
    // is begun.
    if (
      importFileTrigger_elm &&
      importFileTrigger_elm.files !== null &&
      importFileTrigger_elm.files.length > 0
    ) {
      // todo: Uncomment and resolve this.
      // importFileFiles(importFileTrigger_elm.files)
    }
  }

  // Render the list of files.
  return (
    <>
      <List<ClientFileReference>
        name={'Files'}
        items={files}
        columns={[]}
        listButtons={listButtons}
        itemButtons={itemButtons}
        initialSorting={{ column: 'name', method: 'descending' }}
        getItemTooltip={() => tooltipDescription}
        getColumnLabel={getFileColumnLabel}
        getCellText={getFileCellText}
        getListButtonTooltip={getFileListButtonTooltip}
        getItemButtonTooltip={getFileItemButtonTooltip}
        getColumnWidth={getFileColumnWidth}
        onSelection={onFileSelection}
        onListButtonClick={onFileListButtonClick}
        onItemButtonClick={onFileItemButtonClick}
      />
      {/* // todo: Uncomment and resolve this. */}
      {/* <input
        className='ImportFileTrigger'
        type='file'
        ref={importFileTrigger}
        onChange={onImportTriggerChange}
        hidden
      /> */}
    </>
  )
}

/**
 * Props for `FileList`.
 */
export type TFileReferenceList_P = {
  /**
   * The files to display.
   */
  files: ClientFileReference[]
}
