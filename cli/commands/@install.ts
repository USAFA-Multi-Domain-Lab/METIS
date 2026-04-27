import fs from 'fs'
import type { IncomingMessage } from 'http'
import https from 'https'
import * as tar from 'tar'
import { ICONS } from '../util/assets.js'
import {
  getInstallPath,
  getPathIfInstalled,
  verifyTargetEnvId,
} from '../util/pathing.js'
import { StandardCommand } from './StandardCommand.js'
import { FlagArg } from './args/FlagArg.js'
import { PositionalArg } from './args/PositionalArg.js'

/* -- CONSTANTS -- */

/**
 * Authors recognized by METIS as a valid source for
 * target environments. Authors are prioritized in the order
 * listed below when determining from where to download.
 */
const RECOGNIZED_AUTHORS = [
  'USAFA-Multi-Domain-Lab',
  'salient-usafa-cyber-crew',
]

/* -- COMMAND HELPER FUNCTIONS -- */

/**
 * Validates the install which will be performed.
 * @param targetEnvId The target environment ID to validate.
 * @throws Will throw an error if the install should not proceed.
 */
function validateInstallRequest(targetEnvId: string): void {
  verifyTargetEnvId(targetEnvId)

  // Check if target environment is already installed.
  let installPath = getPathIfInstalled(targetEnvId)

  if (installPath) {
    throw new Error(`Target environment '${targetEnvId}' is already installed.`)
  }
}

/**
 * Validates the source repository for downloading the installation
 * files. Checks if a version exists for the given author/targetEnvId
 * in GitHub, and checks if it contains a valid schema.ts file with
 * a TargetEnvSchema definition.
 * @param author Repository author.
 * @param targetEnvId Repository name.
 * @param version Release version tag.
 * @param options Additional options for validating the source.
 * @returns True if valid, false otherwise.
 */
async function validateSource(
  author: string,
  targetEnvId: string,
  version: string,
  options: TValidateSourceOptions = {},
): Promise<boolean> {
  try {
    let schemaUrl = `https://raw.githubusercontent.com/${author}/${targetEnvId}/${version}/schema.ts`
    let headers: Record<string, string> | undefined = undefined

    // Build headers.
    if (options.token) {
      headers = { Authorization: `token ${options.token}` }
    }

    // Download schema.ts and test content.
    let content = await fetchContent(schemaUrl, headers)
    let hasTargetEnvSchema = /new\s+TargetEnvSchema\s*\(/i.test(content)

    return hasTargetEnvSchema
  } catch (err) {
    return false
  }
}

/**
 * Fetches the latest release tag from a GitHub repository.
 * @param author Repository author.
 * @param targetEnvId Repository name.
 * @param options Additional options for fetching the latest version.
 * @returns Latest release tag name (e.g., "v2.3.0").
 */
function getLatestVersion(
  author: string,
  targetEnvId: string,
  options: TGetLatestVersionOptions = {},
): Promise<string> {
  // If no path specified, use the default
  // latest release API endpoint
  let { apiPath = `/repos/${author}/${targetEnvId}/releases/latest`, token } =
    options
  let headers: Record<string, string> = {
    'User-Agent': 'METIS-CLI',
  }

  if (token) {
    headers['Authorization'] = `token ${token}`
  }

  console.log(apiPath)

  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: apiPath,
      method: 'GET',
      headers,
    }

    https
      .get(requestOptions, (response: IncomingMessage) => {
        let data = ''

        if ([301, 302].includes(response.statusCode ?? 0)) {
          // Handle redirects
          console.log(`Redirected to: ${response.headers.location}`)
          getLatestVersion(author, targetEnvId, {
            ...options,
            apiPath: response.headers.location,
          })
            .then(resolve)
            .catch(reject)
          return
        } else if (response.statusCode === 404) {
          reject(new Error('No releases found for this repository'))
          return
        } else if (response.statusCode !== 200) {
          reject(new Error(`GitHub API request failed: ${response.statusCode}`))
          return
        }

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          try {
            const release: TGitHubRelease = JSON.parse(data)
            resolve(release.tag_name)
          } catch (err) {
            reject(new Error('Failed to parse GitHub API response'))
          }
        })
      })
      .on('error', reject)
  })
}

/**
 * Downloads content from a URL and returns it as a string.
 * @param url The URL to fetch content from.
 * @param headers Optional additional request headers.
 * @returns The content as a string.
 */
function fetchContent(
  url: string,
  headers?: Record<string, string>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let requestOptions = {
      headers: {
        'User-Agent': 'METIS-CLI',
        ...headers,
      },
    }

    https
      .get(url, requestOptions, (response: IncomingMessage) => {
        if ([301, 302].includes(response.statusCode ?? 0)) {
          // Handle redirects
          fetchContent(response.headers.location!, headers)
            .then(resolve)
            .catch(reject)
          return
        } else if (response.statusCode === 404) {
          reject(new Error('File not found'))
          return
        } else if (response.statusCode !== 200) {
          reject(new Error(`Request failed: ${response.statusCode}`))
          return
        }

        let data = ''
        response.on('data', (chunk) => {
          data += chunk
        })
        response.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

/**
 * Finds details concerning the given target environment ID,
 * including the author repository and the latest release version.
 * Validates that the version of the repository contains a valid
 * schema.ts file.
 * @param targetEnvId Target environment ID (repository name)
 * @param options Customizes the way in which the details are fetched.
 * @returns Author name and latest version if found, empty object otherwise.
 */
async function fetchDetails(
  targetEnvId: string,
  options: TFetchDetailsOptions = {},
): Promise<TGitHubReleaseDetails> {
  let { author, version, token } = options
  let details: TGitHubReleaseDetails = {}
  let searchList = RECOGNIZED_AUTHORS

  // Overrite search list if author specified.
  if (author) {
    searchList = [author]
  }

  for (let author of searchList) {
    try {
      // Get latest version if version not specified.
      if (!version) {
        version = await getLatestVersion(author, targetEnvId, { token })
      }

      // Validate that custom version exists and has valid schema
      let hasValidSchema = await validateSource(author, targetEnvId, version, {
        token,
      })

      if (!hasValidSchema) {
        // Try next author if custom version invalid
        continue
      }

      details = { author, version }
      break
    } catch (err) {
      // Ignore errors and try next author
    }
  }
  return details
}

/**
 * Simple download function to fetch a file from a URL
 * and save it to a destination path.
 * @param url The location where the file is hosted.
 * @param dest The local path to where the file should be saved.
 * @param options Additional options for the download.
 * @resolves Once the download is complete.
 * @rejects Due to any error during the download process.
 */
function download(
  url: string,
  dest: string,
  options: TDownloadOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    let { token } = options
    let file = fs.createWriteStream(dest)
    let headers: Record<string, string> = {
      'User-Agent': 'METIS-CLI',
      'Accept': 'application/vnd.github+json',
    }

    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    https
      .get(url, { headers }, (response: IncomingMessage) => {
        if ([301, 302].includes(response.statusCode ?? 0)) {
          // Handle redirects - S3 presigned URLs don't accept auth headers,
          // so drop the token on redirect.
          console.log(`Redirected to: ${response.headers.location}`)
          download(response.headers.location!, dest).then(resolve).catch(reject)
          return
        } else if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`))
          return
        }
        response.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
      })
      .on('error', reject)
  })
}

/* -- COMMAND DEFINITION -- */

const arg_targetEnvId = new PositionalArg(
  'targetEnvId',
  'The target environment ID to install.',
)

const arg_author = new FlagArg(
  'author',
  'Specifies the author (repository owner) of the target environment.\n' +
    'Note: If installing from a recognized author (USAFA MDL or MDL partner), this flag is not required.',
  [
    new PositionalArg(
      'authorName',
      "The author's (repository owner) name. This is the organization or user hosting the target environment repository on GitHub.",
    ),
  ],
  { shorten: true },
)

const arg_version = new FlagArg(
  'version',
  'Specifies a specific version (release tag) to install.\n' +
    'Note: By default, the latest version will be installed.',
  [
    new PositionalArg(
      'versionNumber',
      'The version tag to install (e.g., "v1.0.0").',
    ),
  ],
  { shorten: true },
)

const arg_token = new FlagArg(
  'token',
  'A GitHub Personal Access Token (PAT) for accessing private repositories.\n' +
    'Required when the target environment repository is private.\n' +
    'Note: The token must have the "repo" scope.',
  [new PositionalArg('tokenValue', 'The GitHub Personal Access Token value.')],
  { shorten: true },
)

/**
 * Installs the specified target environment by downloading
 * and extracting its latest release from GitHub, depositing
 * it into the integration/target-env directory.
 * @param targetEnvId The target environment ID to install.
 * @resolves Once installation is complete and successful.
 * @rejects Due to any error during the installation process.
 */
export const command_install = new StandardCommand(
  'install',
  'Installs a target environment available on GitHub.',
  [arg_targetEnvId, arg_author, arg_version, arg_token],
  async ({
    targetEnvId,
    author: authorFlagArg,
    version: versionFlagArg,
    token: tokenFlagArg,
  }) => {
    // Validate the install parameters before proceeding.
    validateInstallRequest(targetEnvId)

    // Fetch details about the target environment, throwing
    // if not found in recognized repositories.
    let { author, version } = await fetchDetails(targetEnvId, {
      author: authorFlagArg?.authorName,
      version: versionFlagArg?.versionNumber,
      token: tokenFlagArg?.tokenValue,
    })

    if (!author || !version) {
      // Create a default message, assuming no flags were provided
      // in the args.
      let message: string = `'${targetEnvId}' not found from recognized authors.`

      if (authorFlagArg?.authorName && versionFlagArg?.versionNumber) {
        message = `Version '${versionFlagArg.versionNumber}' of '${targetEnvId}' not found from author, '${authorFlagArg.authorName}'.`
      } else if (authorFlagArg?.authorName) {
        message = `'${targetEnvId}' not found from author, '${authorFlagArg.authorName}'.`
      } else if (versionFlagArg?.versionNumber) {
        message = `Version '${versionFlagArg.versionNumber}' not found for '${targetEnvId}'.`
      }

      throw new Error(message)
    }

    // Gather details.
    const token = tokenFlagArg?.tokenValue
    const url = `https://api.github.com/repos/${author}/${targetEnvId}/tarball/${version}`
    const archive = `${targetEnvId}-${version}.tar.gz`
    const installPath = getInstallPath(targetEnvId)

    // Download the source code for the latest version of
    // the target environment.
    console.log(`${ICONS.pencil} Downloading ${version}...`)
    await download(url, archive, { token })

    // Extract source files into installation directory.
    console.log(`${ICONS.pencil} Extracting to ${installPath}...`)
    fs.mkdirSync(installPath, { recursive: true })
    await tar.x({
      file: archive,
      cwd: installPath,
      strip: 1, // removes repo-version/ top folder
    })

    // Clean up and notify user.
    fs.unlinkSync(archive)
    console.log(
      `${ICONS.success} "${targetEnvId}" was successfully installed! Restart METIS with 'metis restart' for changes to go into effect.`,
    )
  },
  { shorten: true },
)

/* -- TYPES -- */

/**
 * Details about a GitHub release.
 */
interface TGitHubReleaseDetails {
  /**
   * The author (repository owner) of the target environment.
   */
  author?: string
  /**
   * The release version tag.
   */
  version?: string
}

/**
 * Represents a GitHub release response.
 */
interface TGitHubRelease {
  /**
   * The release tag name (e.g., "v2.3.0").
   */
  tag_name: string
}

/**
 * Options for fetching target environment details
 * via {@link fetchDetails}.
 */
interface TFetchDetailsOptions {
  /**
   * Specifies the author (repository owner) of the target environment.
   * If provided, only this author will be searched. By default, the
   * recognized authors listed in {@link RECOGNIZED_AUTHORS} will be searched.
   */
  author?: string
  /**
   * Specifies a specific version (release tag) to use instead of latest.
   * If provided, this version will be validated for existence and
   * schema validity. Otherwise, the latest version will be used.
   */
  version?: string
  /**
   * A GitHub Personal Access Token for authenticating requests to
   * private repositories.
   */
  token?: string
}

/**
 * Additional options for {@link getLatestVersion}.
 */
interface TGetLatestVersionOptions {
  /**
   * The API path to use for the request.
   * If not provided, defaults to the latest release endpoint.
   * Used internally for handling redirects.
   */
  apiPath?: string
  /**
   * A GitHub Personal Access Token for authenticating requests to
   * private repositories.
   */
  token?: string
}

/**
 * Additional options for {@link download}.
 */
interface TDownloadOptions {
  /**
   * A GitHub Personal Access Token for authenticating requests to
   * private repositories.
   */
  token?: string
}

/**
 * Additional options for {@link validateSource}.
 */
interface TValidateSourceOptions {
  /**
   * A GitHub Personal Access Token for authenticating requests to
   * private repositories.
   */
  token?: string
}
