import { Request, Response } from 'express-serve-static-core'
import FileReferenceModel from 'metis/server/database/models/file-references'
import { StatusError } from 'metis/server/http'
import ApiResponse from '../../library/response'

/**
 * This will create and save a reference for a file
 * to the database.
 * @param file The file for which to create a reference.
 * @returns The saved reference.
 */
async function saveReference(file: Express.Multer.File) {
  const { filename, originalname, mimetype, size } = file

  const doc = new FileReferenceModel({
    name: originalname,
    path: filename,
    mimetype,
    size,
  })

  return await doc.save()
}

/**
 * This will handle file uploads.
 * @param request The express request.
 * @param response The express response.
 * @returns The response to send to the client.
 */
const uploadFiles = async (request: Request, response: Response) => {
  // If no files are included in the request,
  // return a 400 status code.
  if (
    !request.files ||
    request.files.length === 0 ||
    !Array.isArray(request.files)
  ) {
    let error = new StatusError('No files were found in the request.', 400)
    return ApiResponse.error(error, response)
  }

  // Save references to the files in the database.
  const uploadedFiles = await Promise.all(request.files.map(saveReference))

  // Send a response, including the resulting data
  // for the newly uploaded files.
  response.json(uploadedFiles)
}

export default uploadFiles
