export default class Queue<T extends any> {
  private queue: Array<T> = []

  /**
   * The current length of the queue.
   */
  public get length(): number {
    return this.queue.length
  }

  public constructor(initialItems: Array<T> = []) {
    this.queue = initialItems
  }

  /**
   * Adds an item to the queue.
   */
  public add(item: T): number {
    return this.queue.push(item)
  }

  /**
   * Gets and removes the next item in the queue.
   */
  public next(): T | undefined {
    return this.queue.shift()
  }

  /**
   * Gets the next item in the queue without removing it.
   */
  public peek(): T | undefined {
    return this.queue[0]
  }
}
