import { Mechanism } from './mechanisms'

export interface IMechanismStateJSON {
  mechanismStateID: string
  mechanismID: string
  name: string
}

export class MechanismState {
  mechanism: Mechanism
  mechanismStateID: string
  name: string

  constructor(mechanism: Mechanism, mechanismStateID: string, name: string) {
    this.mechanism = mechanism
    this.mechanismStateID = mechanismStateID
    this.name = name
  }

  toJSON(): IMechanismStateJSON {
    return {
      mechanismStateID: this.mechanismStateID,
      mechanismID: this.mechanism.mechanismID,
      name: this.name,
    }
  }
}
