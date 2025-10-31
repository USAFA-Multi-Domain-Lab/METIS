import './PendingModal.scss'

/**
 * A map modal responsible for displaying a pending
 * message as an obstructive overlay.
 */
export default function PendingModal({
  message,
}: TPendingModal_P): TReactElement {
  return (
    <div className='PendingModal MapModal'>
      <div className='PendingModalMessage'>{message}</div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link PendingModal} component.
 */
type TPendingModal_P = {
  /**
   * The message to display in the modal.
   */
  message: string
}
