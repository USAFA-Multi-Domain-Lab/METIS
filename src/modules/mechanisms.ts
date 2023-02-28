import { Asset } from './assets'

export interface IMechanismJSON {
  mechanismID: string
  name: string
  states: Array<string>
  selectedState: string
}

export class Mechanism {
  asset: Asset
  mechanismID: string
  name: string
  states: Array<string>
  selectedState: string

  constructor(
    asset: Asset,
    mechanismID: string,
    name: string,
    states: Array<string>,
    selectedState: string,
  ) {
    // This is for when these properties
    // are added to the database
    this.asset = asset
    this.mechanismID = mechanismID
    this.name = name
    this.states = states
    this.selectedState = selectedState
  }

  toJSON(): IMechanismJSON {
    return {
      mechanismID: this.mechanismID,
      name: this.name,
      states: this.states,
      selectedState: this.selectedState,
    }
  }
}
