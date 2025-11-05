import multer from 'multer'
import { MissionImport } from '../missions'

const uploads = multer({ dest: MissionImport.UPLOADS_DIRECTORY })

export default uploads
