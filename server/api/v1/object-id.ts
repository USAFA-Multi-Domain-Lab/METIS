import { Request, Response } from 'express-serve-static-core'
import expressWs from 'express-ws'
import { TMetisRouterMap } from 'metis/server/http/router'
import mongoose from 'mongoose'

const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  /* ---------------------------- READ ------------------------------ */

  /**
   * Generates a new object ID.
   * @returns The new object ID.
   */
  const generateObjectId = (request: Request, response: Response) => {
    // Return the new object ID.
    return response.json(new mongoose.Types.ObjectId().toString())
  }

  /* ---------------------------- ROUTES ---------------------------- */

  // -- GET | /api/v1/object-id/ --
  router.get('/', generateObjectId)
  done()
}

export default routerMap
