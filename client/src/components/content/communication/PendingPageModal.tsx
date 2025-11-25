import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import './PendingPageModal.scss'

/**
 * A map modal responsible for displaying a pending
 * message as an obstructive overlay.
 */
export default function PendingPageModal({
  message,
  active = true,
  erroneous = false,
}: TPendingPageModal_P): TReactElement {
  /**
   * Classes for the root element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('PendingPageModal')
      .switch('ModalActive', 'ModalInactive', active)
      .set('ModalErroneous', erroneous),
  )

  return (
    <div className={rootClasses.value}>
      <div className='ModalMessage'>{message}</div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link PendingPageModal} component.
 */
type TPendingPageModal_P = {
  /**
   * The message to display in the modal.
   */
  message: string
  /**
   * Whether the modal is active and should be displayed.
   * @default true
   */
  active?: boolean
  /**
   * Whether an error occurred during the pending operation.
   * @default false
   */
  erroneous?: boolean
}
