import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import mongoose from 'mongoose'
import type { TMissionImportBuild } from '../MissionImport'

// -- BUILD 26 --
// This migration script is responsible
// for converting any objects nested within
// a mission that have an "_id" property that
// is an ObjectId to a UUID. Also, if the "_id"
// property is missing, a UUID will be generated
// and set as the "_id" property.

const build: TMissionImportBuild = (missionData) => {
  let mission = missionData

  // Loop through forces.
  for (let force of mission.forces) {
    // If the force has an ObjectId as the _id,
    // or if the _id is missing, generate a UUID
    // and set it as the _id.
    if (mongoose.isObjectIdOrHexString(force._id) || !force._id) {
      force._id = StringToolbox.generateRandomId()
    }

    // Loop through nodes.
    for (let node of force.nodes) {
      // If the node has an ObjectId as the _id,
      // or if the _id is missing, generate a UUID
      // and set it as the _id.
      if (mongoose.isObjectIdOrHexString(node._id) || !node._id) {
        node._id = StringToolbox.generateRandomId()
      }

      // Loop through actions.
      for (let action of node.actions) {
        // If the action has an ObjectId as the _id,
        // or if the _id is missing, generate a UUID
        // and set it as the _id.
        if (mongoose.isObjectIdOrHexString(action._id) || !action._id) {
          action._id = StringToolbox.generateRandomId()
        }

        // Loop through effects.
        for (let effect of action.effects) {
          // If the effect has an ObjectId as the _id,
          // or if the _id is missing, generate a UUID
          // and set it as the _id.
          if (mongoose.isObjectIdOrHexString(effect._id) || !effect._id) {
            effect._id = StringToolbox.generateRandomId()
          }
        }
      }
    }
  }
}

export default build
