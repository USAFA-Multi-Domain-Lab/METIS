//npm imports
import express from 'express'

//fields
const router = express.Router()

// -- GET | /* --
// This is the default route that renders the
// compiled React app.
router.get('*', (request, response) => {
  response.sendFile('index.html', { root: './build' })
})

module.exports = router
