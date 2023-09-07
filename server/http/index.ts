export class StatusError extends Error {
  status: number

  constructor(message?: string, status?: number) {
    super(message)
    this.status = status !== undefined ? status : 500
  }
}

export default {
  StatusError,
}
