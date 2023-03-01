import { Asset } from './assets'
import { IMechanismStateJSON, MechanismState } from './mechanism-state'
import { v4 as generateHash } from 'uuid'

export interface IMechanismJSON {
  mechanismID: string
  name: string
  states: Array<MechanismState>
  selectedState: string
}

export class Mechanism {
  asset: Asset
  mechanismID: string
  name: string
  states: Array<MechanismState>
  selectedState: string

  // static createDefaultMechanismState(mechanism: Mechanism) {
  //   return new MechanismState(
  //     mechanism,
  //     generateHash(),
  //     'Unnamed Mechanism State',
  //   )
  // }

  constructor(
    asset: Asset,
    mechanismID: string,
    name: string,
    states: Array<MechanismState>,
    selectedState: string,
    mechanismJSON: Array<IMechanismStateJSON>,
  ) {
    this.asset = asset
    this.mechanismID = mechanismID
    this.name = name
    this.states = states
    this.selectedState = selectedState
    // this.parseMechanismStateJSON(mechanismJSON)
  }

  toJSON(): IMechanismJSON {
    return {
      mechanismID: this.mechanismID,
      name: this.name,
      states: this.states,
      selectedState: this.selectedState,
    }
  }

  // parseMechanismStateJSON(
  //   mechanismStateJSON: Array<IMechanismStateJSON>,
  // ): void {
  //   let states: Array<MechanismState> = []

  //   for (let state of mechanismStateJSON) {
  //     let mechanismStateObject: MechanismState = new MechanismState(
  //       this,
  //       state.mechanismStateID,
  //       state.name,
  //     )
  //     states.push(mechanismStateObject)
  //   }

  //   this.states = states
  // }
}
