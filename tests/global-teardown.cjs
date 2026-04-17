const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const REPO_ROOT = path.resolve(__dirname, '..')

function loadTestEnvironment() {
  dotenv.config({ path: path.resolve(REPO_ROOT, 'config/test.defaults.env') })

  const testEnvPath = path.resolve(REPO_ROOT, 'config/test.env')
  if (fs.existsSync(testEnvPath)) {
    dotenv.config({ path: testEnvPath, override: true })
  }
}

module.exports = async () => {
  try {
    loadTestEnvironment()

    const mongoHost = process.env.MONGO_HOST ?? 'localhost'
    const mongoPort = process.env.MONGO_PORT ?? '27017'
    const mongoDB = process.env.MONGO_DB ?? 'metis-test'
    const mongoUsername = process.env.MONGO_USERNAME
    const mongoPassword = process.env.MONGO_PASSWORD

    mongoose.set('strictQuery', true)

    await mongoose.connect(`mongodb://${mongoHost}:${mongoPort}/${mongoDB}`, {
      user: mongoUsername,
      pass: mongoPassword,
    })

    const collections = await mongoose.connection.db.collections()
    const collectionNames = [
      'sessions',
      'filereferences',
      'users',
      'missions',
      'infos',
    ]

    for (const collection of collections) {
      if (collectionNames.includes(collection.collectionName)) {
        await collection.deleteMany({})
      }
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  }
}
