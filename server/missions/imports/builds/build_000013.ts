import { TMissionImportBuild } from '..'

// -- BUILD 13 --
// This migration script is responsible
// removing default text from existing
// properties with default text.
// (i.e. '<p>No description set...</p>',
// '<p>Description text goes here.</p>')

const build: TMissionImportBuild = (missionData) => {
  let nodeData = missionData.nodeData

  // Loop through nodeData.
  for (let nodeDatum of nodeData) {
    // If the description has default text, set it to an empty string.
    if (
      nodeDatum.description === '<p>No description set...</p>' ||
      nodeDatum.description === '<p>Description text goes here.</p>' ||
      nodeDatum.description === '<p>Description not set...</p>'
    ) {
      nodeDatum.description = '<p><br></p>'
    }

    // If the pre-execution text has default text, set it to an empty string.
    if (
      nodeDatum.preExecutionText === '<p>No pre-execution text set...</p>' ||
      nodeDatum.preExecutionText === '<p>Node has not been executed.</p>'
    ) {
      nodeDatum.preExecutionText = '<p><br></p>'
    }
  }
}

export default build
