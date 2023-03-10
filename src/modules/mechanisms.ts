import { Asset } from './assets'
import { IMechanismStateJSON, MechanismState } from './mechanism-state'
import { v4 as generateHash } from 'uuid'

export interface IMechanismJSON {
  mechanismID: string
  assetID: string
  name: string
  states: Array<MechanismState>
}

export class Mechanism {
  asset: Asset
  mechanismID: string
  name: string
  states: Array<MechanismState>
  selectedState: MechanismState | null

  static createDefaultMechanismState(mechanism: Mechanism) {
    return new MechanismState(
      mechanism,
      generateHash(),
      'Unnamed Mechanism State',
    )
  }

  constructor(
    asset: Asset,
    mechanismID: string,
    name: string,
    states: Array<MechanismState>,
    mechanismStateJSON: Array<IMechanismStateJSON>,
  ) {
    this.asset = asset
    this.mechanismID = mechanismID
    this.name = name
    this.states = states
    this.selectedState = null
    this.parseMechanismStateJSON(mechanismStateJSON)
  }

  toJSON(): IMechanismJSON {
    return {
      mechanismID: this.mechanismID,
      assetID: this.asset.assetID,
      name: this.name,
      states: this.states,
    }
  }

  parseMechanismStateJSON(
    mechanismStateJSON: Array<IMechanismStateJSON>,
  ): void {
    let states: Array<MechanismState> = []

    for (let state of mechanismStateJSON) {
      let mechanismStateObject: MechanismState = new MechanismState(
        this,
        state.mechanismStateID,
        state.name,
      )
      states.push(mechanismStateObject)
    }

    this.states = states
  }
}
