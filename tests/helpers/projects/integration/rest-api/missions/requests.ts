import { expect } from '@jest/globals'
import type { TFileImportResults } from '@server/missions/imports/MissionImport'
import type {
  TMissionExistingJson,
  TMissionShallowExistingJson,
} from '@shared/missions/Mission'
import FormData from 'form-data'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import type { TMissionCreatePayload } from './payload'

/**
 * Fetches a mission by ID through the REST API.
 * @param client The test HTTP client.
 * @param missionId The mission ID.
 * @returns The mission.
 */
export async function fetchMission(
  client: TestHttpClient,
  missionId: string,
): Promise<TMissionExistingJson> {
  let response = await client.get<TMissionExistingJson>(
    `/api/v1/missions/${missionId}/`,
  )

  expect(response.status).toBe(200)
  return response.data
}

/**
 * Fetches the mission list used by the REST API index route.
 * @param client The test HTTP client.
 * @returns The missions.
 */
export async function fetchAllMissions(
  client: TestHttpClient,
): Promise<TMissionShallowExistingJson[]> {
  let response =
    await client.get<TMissionShallowExistingJson[]>('/api/v1/missions/')

  expect(response.status).toBe(200)
  expect(Array.isArray(response.data)).toBe(true)
  return response.data
}

/**
 * Exports a mission archive through the REST API.
 * @param client The test HTTP client.
 * @param missionId The mission ID.
 * @returns The exported archive bytes.
 */
export async function exportMissionArchive(
  client: TestHttpClient,
  missionId: string,
): Promise<Buffer> {
  let response = await client.get(`/api/v1/missions/${missionId}/export/file`, {
    responseType: 'arraybuffer',
  })

  expect(response.status).toBe(200)
  return Buffer.from(response.data)
}

/**
 * Imports a mission archive through the REST API.
 * @param client The test HTTP client.
 * @param archiveBuffer The archive bytes.
 * @param fileName The filename to upload.
 * @returns The import result.
 */
export async function importMissionArchive(
  client: TestHttpClient,
  archiveBuffer: Buffer,
  fileName: string,
): Promise<TFileImportResults> {
  let form = new FormData()
  form.append('files', archiveBuffer, {
    filename: fileName,
    contentType: 'application/zip',
  })

  let response = await client.post<TFileImportResults>(
    '/api/v1/missions/import/',
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    },
  )

  expect(response.status).toBe(200)
  return response.data
}

/**
 * Finds the mission created by an import run.
 * @param missions The mission list.
 * @param missionName The mission name to match.
 * @param existingMissionIds Mission IDs that existed before import.
 * @returns The imported mission, if found.
 */
export function findImportedMission(
  missions: TMissionShallowExistingJson[],
  missionName: string,
  existingMissionIds: Set<string>,
): TMissionShallowExistingJson | undefined {
  return missions.find(
    (mission) =>
      mission.name === missionName && !existingMissionIds.has(mission._id),
  )
}

/**
 * Creates a full update payload from an existing mission.
 * @param mission The existing mission.
 * @returns The update payload.
 */
export function createMissionUpdatePayload(
  mission: TMissionExistingJson,
): TMissionCreatePayload & { _id: string } {
  return {
    _id: mission._id,
    name: mission.name,
    versionNumber: mission.versionNumber,
    seed: mission.seed,
    resources: cloneJson(mission.resources),
    structure: cloneJson(mission.structure),
    forces: cloneJson(mission.forces),
    prototypes: cloneJson(mission.prototypes),
    files: mission.files.map((file) => ({
      _id: file._id,
      alias: file.alias,
      lastKnownName: file.lastKnownName,
      initialAccess: cloneJson(file.initialAccess),
      reference:
        typeof file.reference === 'string'
          ? file.reference
          : file.reference._id,
    })),
    effects: cloneJson(mission.effects),
  }
}

function cloneJson<T>(value: T): T {
  return structuredClone(value)
}
