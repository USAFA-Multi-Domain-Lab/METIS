import fs from 'fs'
import express from 'express'

const router = express.Router()

router.get('/changelog/', (request, response) => {
  let changelog: string = fs.readFileSync('./public/changelog.md', {
    encoding: 'utf8',
  })

  return response.json({ changelog })
})

module.exports = router
