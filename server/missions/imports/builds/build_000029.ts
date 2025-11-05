import { StringToolbox } from 'metis/toolbox'
import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 29 --
// This migration script is responsible
// for creating an array of prototypes
// within a mission and extracting the
// "structureKey" and "depthPadding"
// properties from the "nodes" array
// and setting them on the prototype.
// It also renames the "nodeStructure"
// property to "structure" and adds a
// "prototypeId" property to each node.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Rename nodeStructure to structure.
  mission.structure = mission.nodeStructure
  delete mission.nodeStructure

  // Create prototypes array.
  mission.prototypes = []

  // Loop through forces.
  for (let force of mission.forces) {
    // Loop through nodes.
    for (let node of force.nodes) {
      // See if prototype already exists.
      let prototype = mission.prototypes.find(
        (prototype: any) => prototype.structureKey === node.structureKey,
      )

      // If the prototype doesn't already exist, create it.
      if (prototype === undefined) {
        let prototypeId = StringToolbox.generateRandomId()

        // Create prototype object.
        let prototype = {
          _id: prototypeId,
          structureKey: node.structureKey,
          depthPadding: node.depthPadding,
        }

        // Add prototype to mission.
        mission.prototypes.push(prototype)

        // Set prototypeId on node.
        node.prototypeId = prototypeId
      }
      // Set prototypeId on node.
      else {
        node.prototypeId = prototype._id
      }

      // Delete structureKey and depthPadding from node.
      delete node.structureKey
      delete node.depthPadding
    }
  }
}

export default build
