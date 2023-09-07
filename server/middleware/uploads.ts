import multer from 'multer'

const uploads = multer({ dest: 'temp/missions/imports/' })

export default uploads
