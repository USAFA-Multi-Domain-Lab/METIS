import { AxiosProgressEvent } from 'axios'
import { EventManager, TListenerTargetEmittable } from 'metis/events'
import { StringToolbox } from 'metis/toolbox'
import { MetisComponent } from '../../../../../../../shared'

/**
 * Manages an upload for an item in a list.
 */
export class ListUpload
  extends MetisComponent
  implements TListenerTargetEmittable<TListUploadEvent>
{
  /**
   * @see {@link amountTransferred}
   */
  private _amountTransferred: number = 0
  /**
   * The total amount of data transferred in
   * the upload so far, in bytes.
   */
  public get amountTransferred(): number {
    return this._amountTransferred
  }

  /**
   * @see {@link payloadSize}
   */
  private _payloadSize: number
  /**
   * The total payload for the upload, in bytes.
   */
  public get payloadSize(): number {
    return this._payloadSize
  }

  /**
   * The progress of the file upload, from 0% to 100%.
   */
  public get progress(): number {
    return this.payloadSize > 0
      ? (this.amountTransferred / this.payloadSize) * 100
      : 0
  }

  /**
   * Takes @link {@link progress} and formats it for
   * display in the UI.
   */
  public get progressFormatted(): string {
    return ListUpload.formatProgress(this.progress)
  }

  /**
   * A controller which can be used in an Axios request
   * to cancel the upload.
   * @note This can be used in conjunction with the
   * {@link cancel} method.
   */
  public readonly abortController: AbortController

  /**
   * Manages events for the upload.
   */
  private eventManager: EventManager<TListUploadEvent>

  /**
   * @param name The name of the upload, used for display.
   * @param payloadSize The size in bytes of the upload.
   * @param options Additional options for the construction of the upload.
   */
  public constructor(
    name: string,
    payloadSize: number,
    options: TListUploadOptions = {},
  ) {
    super(StringToolbox.generateRandomId(), name, false)

    const { onCancel } = options

    this._amountTransferred = 0
    this._payloadSize = payloadSize
    this.abortController = new AbortController()
    this.abortController.signal.addEventListener('abort', () => {
      if (onCancel) onCancel()
    })

    this.eventManager = new EventManager<TListUploadEvent>(this)

    this.emitEvent = this.eventManager.emitEvent
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
  }

  /**
   * Cancels the upload by using the abort controller
   * assigned to the upload.
   * @see {@link abortController}
   * @note This will only work if the abort controller
   * was included in the options for Axios.
   */
  public cancel(): void {
    this.abortController.abort()
  }

  /**
   * A callback that can be used by Axios to
   * report the progress of the upload.
   * @param event An event fired by Axios during
   * the upload process.
   */
  public onProgress = (event: AxiosProgressEvent) => {
    this._amountTransferred = event.loaded
    this.emitEvent('progress')
  }

  // Implemented
  public emitEvent: (method: TListUploadEvent) => void

  // Implemented
  public addEventListener: (
    method: TListUploadEvent,
    callback: () => any,
  ) => void

  // Implemented
  public removeEventListener: (
    method: TListUploadEvent,
    callback: () => any,
  ) => void

  /**
   * @param uploads A list of uploads to evaluate.
   * @returns The total progress of all uploads.
   */
  public static calculateTotalProgress(...uploads: ListUpload[]): number {
    let totalPayloadSize = uploads.reduce(
      (totalSize, upload) => totalSize + upload.payloadSize,
      0,
    )
    let totalAmountTransferred = uploads.reduce(
      (totalTransferred, upload) => totalTransferred + upload.amountTransferred,
      0,
    )
    return totalPayloadSize > 0
      ? (totalAmountTransferred / totalPayloadSize) * 100
      : 0
  }

  /**
   * @param progress Progress from 0 to 100 to format.
   * @returns The formatted version of the given progress.
   */
  public static formatProgress(progress: number): string {
    return `${progress.toFixed(2)}%`
  }
}

/**
 * Possible events emitted for {@link ListUpload}.
 */
export type TListUploadEvent = 'progress'

/**
 * Options for {@link ListUpload}.
 */
export type TListUploadOptions = {
  /**
   * A callback that is called when the upload is cancelled
   * via the {@link ListUpload.cancel} method.
   */
  onCancel?: () => void
}
