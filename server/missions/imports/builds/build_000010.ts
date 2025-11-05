import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 10 --
// This migration script is responsible
// for changing the color property's
// value at the node level of the
// missions collection to use hexidecimal
// values.

const build: TMissionImportBuild = (missionData) => {
  let nodeData = missionData.nodeData

  for (let nodeDatum of nodeData) {
    let color = nodeDatum.color

    if (color === 'default') {
      nodeDatum.color = '#ffffff'
    } else if (color === 'green') {
      nodeDatum.color = '#65eb59'
    } else if (color === 'pink') {
      nodeDatum.color = '#fa39ac'
    } else if (color === 'yellow') {
      nodeDatum.color = '#f7e346'
    } else if (color === 'blue') {
      nodeDatum.color = '#34a1fb'
    } else if (color === 'purple') {
      nodeDatum.color = '#ae66d6'
    } else if (color === 'red') {
      nodeDatum.color = '#f9484f'
    } else if (color === 'brown') {
      nodeDatum.color = '#ac8750'
    } else if (color === 'orange') {
      nodeDatum.color = '#ffab50'
    }
  }
}

export default build
