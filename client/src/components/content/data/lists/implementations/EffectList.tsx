import React from 'react'
import { ClientEffect, TClientTriggerDataExec } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useDefaultProps } from 'src/toolbox/hooks'
import List, { createDefaultListProps, TList_P } from '../List'

/**
 * A component for displaying a list of effects.
 * @note Uses the `List` component.
 */
export default function EffectList(props: TEffectList_P): JSX.Element | null {
  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {
    ...createDefaultListProps<ClientEffect>(),
    itemsPerPageMin: 10,
    columns: [],
    listButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []
      // If the `onCreateRequest` prop is provided,
      // add the add button.
      if (props?.onCreateRequest) {
        results.push('add')
      }
      return results
    }),
    itemButtonIcons: compute<TMetisIcon[]>(() => {
      let results: TMetisIcon[] = []

      // If the `onOpenRequest` prop is provided,
      // add the open button.
      if (props?.onOpenRequest) {
        results.push('open')
      }
      // If the `onDuplicateRequest` props is provided,
      // add the copy button.
      if (props?.onDuplicateRequest) {
        results.push('copy')
      }
      // If the `onDeleteRequest` prop is provided,
      // add the remove button.
      if (props?.onDeleteRequest) {
        results.push('remove')
      }

      return results
    }),
    getListButtonLabel: (button) => {
      switch (button) {
        case 'add':
          return 'Create a new effect'
        default:
          return ''
      }
    },
    getListButtonPermissions: (button) => {
      switch (button) {
        case 'add':
          return ['missions_write']
        default:
          return []
      }
    },
    getItemButtonLabel: (button) => {
      switch (button) {
        case 'open':
          return 'View effect'
        case 'copy':
          return 'Duplicate effect'
        case 'remove':
          return 'Delete effect'
        default:
          return ''
      }
    },
    getItemButtonPermissions: (button) => {
      switch (button) {
        case 'open':
          return ['missions_read']
        case 'copy':
        case 'remove':
          return ['missions_write']
        default:
          return []
      }
    },
    onItemDblClick: (mission) => {
      onOpenRequest(mission)
    },
    onListButtonClick: (button) => {
      switch (button) {
        case 'add':
          onCreateRequest()
          break
        default:
          console.warn('Unknown button clicked in effect list.')
          break
      }
    },
    onItemButtonClick: (button, effect) => {
      switch (button) {
        case 'open':
          onOpenRequest(effect)
          break
        case 'copy':
          onDuplicateRequest(effect)
          break
        case 'remove':
          onDeleteRequest(effect)
          break
        default:
          console.warn('Unknown button clicked in effect list.')
          break
      }
    },
    rootRef: React.useRef<HTMLDivElement>(null),
    onCreateRequest: () => {},
    onOpenRequest: () => {},
    onDuplicateRequest: () => {},
    onDeleteRequest: () => {},
  })
  const {
    onCreateRequest,
    onOpenRequest,
    onDuplicateRequest,
    onDeleteRequest,
  } = defaultedProps

  /* -- RENDER -- */

  return <List<ClientEffect<TClientTriggerDataExec>> {...defaultedProps} />
}

/* -- TYPES -- */

/**
 * Props for EffectList component.
 */
export interface TEffectList_P
  extends TList_P<ClientEffect<TClientTriggerDataExec>> {
  /**
   * Callback to handle a request to create a new effect.
   * @default () => {}
   * @note If not provided, the add button will not be shown.
   */
  onCreateRequest?: () => void
  /**
   * Callback to handle a request to open/view an effect.
   * @param effect The effect to open/view.
   * @default () => {}
   * @note If not provided, the open button will not be used.
   */
  onOpenRequest?: (effect: ClientEffect<TClientTriggerDataExec>) => void
  /**
   * Callback to handle a request to duplicate an effect.
   * @param effect The effect to duplicate.
   * @default () => {}
   * @note If not provided, the copy button will not be used.
   */
  onDuplicateRequest?: (effect: ClientEffect<TClientTriggerDataExec>) => void
  /**
   * Callback to handle a request to delete an effect.
   * @param effect The effect to delete.
   * @default () => {}
   * @note If not provided, the remove button will not be used.
   */
  onDeleteRequest?: (effect: ClientEffect<TClientTriggerDataExec>) => void
}
