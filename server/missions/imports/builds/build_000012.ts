import { TMissionImportBuild } from '..'

// -- BUILD 12 --
// This migration script is responsible
// for updating all the properties that
// are allowed to have rich text to
// be wrapped in "p" tags.

const build: TMissionImportBuild = (missionData) => {
  missionData.introMessage = `<p>${missionData.introMessage}</p>`

  let nodeData = missionData.nodeData

  for (let nodeDatum of nodeData) {
    nodeDatum.description = `<p>${nodeDatum.description}</p>`
    nodeDatum.preExecutionText = `<p>${nodeDatum.preExecutionText}</p>`

    let actions: any[] = nodeDatum.actions
    for (let action of actions) {
      action.description = `<p>${action.description}</p>`
      action.postExecutionSuccessText = `<p>${action.postExecutionSuccessText}</p>`
      action.postExecutionFailureText = `<p>${action.postExecutionFailureText}</p>`
    }
  }
}

export default build
