import fs from 'fs'
import type { TUserAccessId, TUserJson } from 'metis/users'
import { UserAccess } from 'metis/users'
import { createInterface } from 'readline/promises'
import { MetisServer } from '../../..'
import { ServerUser } from '../../../users'
import { hashPassword, UserModel } from '../../models/users'

/**
 * Parses the data into an array of users JSON.
 * @param data The data to parse.
 * @returns An array of users.
 */
const parseUsers = async (data: string) => {
  // Split the data into lines and remove empty lines.
  const lines = data.split('\n').filter((line) => line.trim() !== '')
  // Remove the header row
  lines.shift()
  // Parse the data.
  const users = lines.map(async (line) => {
    const [
      username,
      accessId,
      firstName,
      lastName,
      password,
      needsPasswordReset,
    ] = line.split(',').map((value) => value.trim())

    // Skip invalid access IDs.
    if (
      !UserAccess.AVAILABLE_ACCESSES_IDS.includes(accessId as TUserAccessId)
    ) {
      throw new Error(`Invalid access ID: ${accessId}`)
    }

    const hashedPassword = await hashPassword(password)
    // Convert the needsPasswordReset value to a boolean.
    const updatedPasswordReset = needsPasswordReset.toLowerCase() === 'true'

    const user: TUserInsertData = {
      username,
      accessId: accessId as TUserAccessId,
      firstName,
      lastName,
      password: hashedPassword,
      needsPasswordReset: updatedPasswordReset,
      expressPermissionIds: [],
      createdBy: ServerUser.SYSTEM_ID,
      createdByUsername: ServerUser.SYSTEM_USERNAME,
    }

    return user
  })

  return await Promise.all(users)
}

/**
 * Parses the data into an array of usernames.
 * @param data The data to parse.
 * @returns An array of usernames.
 */
const parseUsernames = (data: string) => {
  // Initialize an array to store the users.
  let usernames: TUserJson['_id'][] = []

  // Iterate over each line in the data.
  for (let line of data.split('\n')) {
    // Skip empty lines.
    if (!line) continue

    // Split the line into an array of values.
    let [username] = line.split(',')

    // Skip the header row.
    if (username === 'username') continue

    // Add the user to the array.
    usernames.push(username)
  }

  return usernames
}

/**
 * Prompts the user to enter the name of the CSV file.
 * @param files The files in the current directory.
 * @returns The name of the CSV file.
 */
const commandLinePrompt = async (
  question: string,
  autocompleteOptions: string[] = [],
): Promise<string> => {
  // Create a completer function for tab completion.
  const completer = (line: string) => {
    const hits = autocompleteOptions.filter((c) => c.startsWith(line))
    return [hits.length ? hits : autocompleteOptions, line]
  }

  // Create an interface for reading input from the command line.
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  })

  // Prompt the user to enter the name of the CSV file.
  const answer = await rl.question(question)
  // Close the readline interface.
  rl.close()
  // Return the name of the CSV file.
  return answer
}

/**
 * Connects to the database.
 */
const connectToDatabase = async () => {
  // Start the temporary server.
  let server = new MetisServer({
    port: 49152,
  })
  // Connect to the database.
  console.log('Connecting to database...')
  await server.database.connect()
}

/**
 * Manages the users found in the CSV file.
 */
const manageUsers = async () => {
  try {
    // Prompt the user to enter the path to the CSV file.
    const csvFilePath = await commandLinePrompt(
      'Enter the path to the CSV file: ',
    )

    // Check if the file exists and is a .csv file.
    const fileExists = fs.existsSync(csvFilePath)
    const isCsvFile =
      fs.lstatSync(csvFilePath).isFile() && csvFilePath.endsWith('.csv')
    if (!fileExists) throw new Error('File does not exist.')
    if (!isCsvFile) throw new Error('File is not a .csv file.')

    // Import data from the .csv file found in the current directory.
    const data = fs.readFileSync(csvFilePath, 'utf8')

    // Log message.
    console.log('Parsing data...')

    // Get the method from the environment.
    const method = process.argv[process.argv.length - 1].replace('--', '')

    if (method === 'create' || method === 'restore') {
      // Parse the data.
      const users: TUserInsertData[] = await parseUsers(data)
      // Connect to the database.
      await connectToDatabase()

      switch (method) {
        case 'create':
          // Log message.
          console.log('Creating users...')
          // Create the users in the database.
          await UserModel.insertMany(users)
          // Log message.
          console.log('Users created successfully.')
          break
        case 'restore':
          // Log message.
          console.log('Restoring users...')
          // Restore the users in the database.
          await UserModel.updateMany(
            { username: { $in: users.map((user) => user.username) } },
            { deleted: false },
            { includeDeleted: true },
          )
          // Log message.
          console.log('Users restored successfully.')
          break
      }
    } else if (method === 'delete' || method === 'archive') {
      // Parse the data.
      const usernames: TUserJson['_id'][] = parseUsernames(data)

      // Connect to the database.
      await connectToDatabase()

      switch (method) {
        case 'delete':
          // Log message.
          console.log('Deleting users...')
          // Delete the users in the database.
          await UserModel.deleteMany({ username: { $in: usernames } })
          // Log message.
          console.log('Users deleted successfully.')
          break
        case 'archive':
          // Log message.
          console.log('Archiving users...')
          // Archive the users in the database.
          await UserModel.updateMany(
            { username: { $in: usernames } },
            { deleted: true },
          )
          // Log message.
          console.log('Users archived successfully.')
          break
      }
    }

    // Exit the process.
    process.exit(0)
  } catch (error: any) {
    const method = process.argv[process.argv.length - 1].replace('--', '')
    console.error(`Failed to ${method} users.\n`, error)
    process.exit(1)
  }
}

// Execute.
manageUsers()

/**
 * Type for data that will be used to insert a
 * new user into the database.
 */
type TUserInsertData = Omit<
  TUserJson,
  '_id' | 'createdAt' | 'updatedAt' | 'preferences'
>
