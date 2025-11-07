import { MissionImport } from '@server/missions/imports/MissionImport'
import multer from 'multer'

const uploads = multer({ dest: MissionImport.UPLOADS_DIRECTORY })

export default uploads
