/**
 * A static utility class for working with promises.
 * @note This class is a placeholder for now and does
 * not currently contain any methods.
 */
export class PromiseToolbox {
  /**
   * Creates a publisher method which calls publish inteligently.
   * This method will queue consecutive calls, ensure unnecessary
   * publishes are not made. Calls will be queued until a pending publish
   * is resolved, at which one additional publish will be made for all
   * currently queued calls.
   * @param publish The method responsible for publishing the data.
   * @returns A method which should be called to publish the data.
   */
  public static createDeferredPublisher<TData extends any[]>(
    publish: (...data: TData) => Promise<void>,
  ) {
    let isPublishing = false
    let queuedData: TData | null = null
    let queuedResolvers: {
      resolve: () => void
      reject: (reason?: any) => void
    }[] = []

    // Processes the current queue of calls.
    async function processQueue() {
      // If there are no queued data, abort.
      // Theoretically, this should never happen.
      if (queuedData === null) return

      const data = queuedData
      const resolvers = [...queuedResolvers]

      // Reset before await to avoid mixing with new calls
      queuedData = null
      queuedResolvers = []
      isPublishing = true

      try {
        // Initiate the publish call with the
        // latest data.
        await publish(...data)
        // After the publish is complete, mark
        // that a publish is no longer in progress.
        isPublishing = false
        // Call all resolvers queued for this publish.
        resolvers.forEach(({ resolve }) => resolve())
        // If more calls queued up during the request,
        // process again.
        if (queuedData !== null) {
          processQueue()
        }
      } catch (error) {
        isPublishing = false
        console.error('Deferred publish failed:', error)
        resolvers.forEach(({ reject }) => reject(error))
      } finally {
      }
    }

    return function deferredPublisher(...data: TData): Promise<void> {
      // Ensure up-to-date data for publishing
      // by overwriting any previously queued data.
      queuedData = data

      return new Promise((resolve, reject) => {
        // Queue the resolver to be called
        // when the queue is next processed.
        queuedResolvers.push({ resolve, reject })

        // If not already posting, process the queue
        // immediately.
        if (!isPublishing) {
          processQueue()
        }
      })
    }
  }
}
