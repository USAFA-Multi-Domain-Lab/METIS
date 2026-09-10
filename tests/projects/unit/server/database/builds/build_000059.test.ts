import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import path from 'path'

const BUILD_FILE_PATH = path.resolve(
  process.cwd(),
  'server/database/builds/build_000059.js',
)
const mongoshGlobals = global as typeof globalThis & Partial<TMongoshGlobals>

// A stored value carrying markup the allow-list does not permit, and what the
// migration should leave in its place.
const SCRIPT_VALUE = '<p>Briefing</p><script>alert("xss")</script>'
const SCRIPT_SANITIZED = '<p>Briefing</p>'
const HANDLER_VALUE = '<p>Alert</p><img src="x" onerror="alert(\'xss\')" />'
const HANDLER_SANITIZED = '<p>Alert</p>'

// A value the editor could have written, which must come back untouched.
const CLEAN_VALUE = '<h3>Heading</h3><p><strong>Bold</strong></p>'

// A stored style attribute mixing a declaration that names a remote resource
// with the three the editor writes, and what the migration should leave.
const DIRTY_STYLED_VALUE =
  '<p style="color: red; background: url(https://example.test/x.png); text-align: center">Briefing</p>'
const DIRTY_STYLED_SANITIZED =
  '<p style="color: red; text-align: center;">Briefing</p>'

// A stored style attribute the editor could have written on its own.
const CLEAN_STYLE_VALUE =
  '<p style="color: #52b1ff; line-height: 2; text-align: center">Briefing</p>'

describe('build_000059 database migration', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    Reflect.deleteProperty(mongoshGlobals, 'db')
    Reflect.deleteProperty(mongoshGlobals, 'print')
    Reflect.deleteProperty(mongoshGlobals, 'use')
  })

  test('rewrites a large-string argument holding a script and writes the mission back', () => {
    let { missionUpdateOne } = runBuild([
      createMission({
        effects: [
          // A target and parameter outside the rich-text pairs, so the type
          // recorded on the argument is the only thing that can match it.
          createEffect({
            targetId: 'file-access',
            arguments: [
              createArgument({ parameterId: 'note', value: SCRIPT_VALUE }),
            ],
          }),
        ],
      }),
    ])

    expect(missionUpdateOne).toHaveBeenCalledTimes(1)

    let [filter, payload] = missionUpdateOne.mock.calls[0]
    expect(filter).toEqual({ _id: 'mission-1' })
    expect(payload.$set.effects[0].arguments[0].value).toBe(SCRIPT_SANITIZED)
  })

  test('sanitizes an output or node-alert message still recorded as unknown', () => {
    let { missionUpdateOne } = runBuild([
      createMission({
        effects: [
          createEffect({
            _id: 'effect-output',
            targetId: 'output',
            arguments: [
              createArgument({ type: 'unknown', value: SCRIPT_VALUE }),
            ],
          }),
          createEffect({
            _id: 'effect-alert',
            targetId: 'node-alert',
            arguments: [
              createArgument({ type: 'unknown', value: HANDLER_VALUE }),
            ],
          }),
        ],
      }),
    ])

    let [, payload] = missionUpdateOne.mock.calls[0]
    expect(payload.$set.effects[0].arguments[0].value).toBe(SCRIPT_SANITIZED)
    expect(payload.$set.effects[1].arguments[0].value).toBe(HANDLER_SANITIZED)
  })

  test('leaves an unknown argument on any other target or parameter alone', () => {
    let { missionUpdateOne, missions } = runBuild([
      createMission({
        effects: [
          // The right parameter on a target that holds no rich text.
          createEffect({
            _id: 'effect-delay',
            targetId: 'delay',
            arguments: [
              createArgument({ type: 'unknown', value: SCRIPT_VALUE }),
            ],
          }),
          // The right target, but a parameter that holds no rich text.
          createEffect({
            _id: 'effect-output',
            targetId: 'output',
            arguments: [
              createArgument({
                parameterId: 'to',
                type: 'unknown',
                value: SCRIPT_VALUE,
              }),
            ],
          }),
        ],
      }),
    ])

    expect(missions[0].effects[0].arguments[0].value).toBe(SCRIPT_VALUE)
    expect(missions[0].effects[1].arguments[0].value).toBe(SCRIPT_VALUE)
    expect(missionUpdateOne).not.toHaveBeenCalled()
  })

  test('skips an argument whose value is not a string and leaves it absent', () => {
    let { missionUpdateOne, missions } = runBuild([
      createMission({
        effects: [
          createEffect({
            // No value key at all: an optional message never filled in.
            arguments: [createArgument({})],
          }),
        ],
      }),
    ])

    expect(missions[0].effects[0].arguments[0]).not.toHaveProperty('value')
    expect(missionUpdateOne).not.toHaveBeenCalled()
  })

  test('sanitizes effects on a mission marked deleted', () => {
    let { missionFind, missionUpdateOne } = runBuild([
      createMission({
        deleted: true,
        effects: [
          createEffect({
            arguments: [createArgument({ value: SCRIPT_VALUE })],
          }),
        ],
      }),
    ])

    // Every mission is read, deleted or not.
    expect(missionFind).toHaveBeenCalledWith({})

    let [filter, payload] = missionUpdateOne.mock.calls[0]
    expect(filter).toEqual({ _id: 'mission-1' })
    expect(payload.$set.effects[0].arguments[0].value).toBe(SCRIPT_SANITIZED)
  })

  test('sanitizes both root effects and effects nested under a force', () => {
    let { missionUpdateOne } = runBuild([
      createMission({
        effects: [
          createEffect({
            _id: 'effect-root',
            arguments: [createArgument({ value: SCRIPT_VALUE })],
          }),
        ],
        forces: [
          createForce([
            createEffect({
              _id: 'effect-action',
              arguments: [createArgument({ value: HANDLER_VALUE })],
            }),
          ]),
        ],
      }),
    ])

    let [, payload] = missionUpdateOne.mock.calls[0]
    expect(payload.$set.effects[0].arguments[0].value).toBe(SCRIPT_SANITIZED)
    expect(
      payload.$set.forces[0].nodes[0].actions[0].effects[0].arguments[0].value,
    ).toBe(HANDLER_SANITIZED)
  })

  test('does not write back a mission whose values need no change', () => {
    let { missionUpdateOne, printLines } = runBuild([
      createMission({
        effects: [
          createEffect({
            arguments: [createArgument({ value: CLEAN_VALUE })],
          }),
        ],
      }),
    ])

    expect(missionUpdateOne).not.toHaveBeenCalled()
    expect(printLines.join('\n')).toContain('No stored value needed changing.')
  })

  test('sets the schema build number to 59', () => {
    let { infosUpdateOne } = runBuild([createMission({})])

    expect(infosUpdateOne).toHaveBeenCalledTimes(1)
    expect(infosUpdateOne).toHaveBeenCalledWith(
      {},
      { $set: { schemaBuildNumber: 59 } },
    )
  })

  test('does not print the markup it removed', () => {
    let { printLines } = runBuild([
      createMission({
        effects: [
          createEffect({
            arguments: [createArgument({ value: SCRIPT_VALUE })],
          }),
        ],
      }),
    ])

    let output = printLines.join('\n')

    // The change is reported by identifier.
    expect(output).toContain('mission-1')
    expect(output).toContain('effect-1')
    expect(output).toContain('parameter "message"')

    // The markup itself never reaches the log.
    expect(output).not.toContain('<script')
    expect(output).not.toContain('alert(')
    expect(output).not.toContain(SCRIPT_VALUE)
  })

  test('rewrites a stored style attribute naming a remote resource and keeps the rest', () => {
    let { missionUpdateOne } = runBuild([
      createMission({
        effects: [
          createEffect({
            arguments: [createArgument({ value: DIRTY_STYLED_VALUE })],
          }),
        ],
      }),
    ])

    expect(missionUpdateOne).toHaveBeenCalledTimes(1)

    let [, payload] = missionUpdateOne.mock.calls[0]
    expect(payload.$set.effects[0].arguments[0].value).toBe(
      DIRTY_STYLED_SANITIZED,
    )
    expect(payload.$set.effects[0].arguments[0].value).not.toContain(
      'example.test',
    )
  })

  test('leaves a stored style attribute of only allowed properties alone', () => {
    let { missionUpdateOne, missions } = runBuild([
      createMission({
        effects: [
          createEffect({
            arguments: [createArgument({ value: CLEAN_STYLE_VALUE })],
          }),
        ],
      }),
    ])

    expect(missions[0].effects[0].arguments[0].value).toBe(CLEAN_STYLE_VALUE)
    expect(missionUpdateOne).not.toHaveBeenCalled()
  })
})

function runBuild(missions: TMission[]) {
  // Clone the missions before the build mutates them in place.
  let cursorMissions = structuredClone(missions)
  let missionFind = jest.fn<TMissionFind>(() => createCursor(cursorMissions))
  let missionUpdateOne = jest.fn<TMissionUpdateOne>()
  let infosUpdateOne = jest.fn<TInfosUpdateOne>()
  let printLines: string[] = []

  mongoshGlobals.use = jest.fn()
  mongoshGlobals.print = jest.fn((line?: unknown) => {
    printLines.push(String(line))
  })
  mongoshGlobals.db = {
    missions: {
      find: missionFind,
      updateOne: missionUpdateOne,
    },
    infos: {
      updateOne: infosUpdateOne,
    },
  }

  // This build runs on require, so set the mongosh globals first.
  jest.isolateModules(() => {
    require(BUILD_FILE_PATH)
  })

  return {
    missionFind,
    missionUpdateOne,
    infosUpdateOne,
    printLines,
    missions: cursorMissions,
  }
}

function createCursor<T>(items: T[]) {
  let index = 0

  return {
    hasNext: () => index < items.length,
    next: () => items[index++],
  }
}

function createArgument(overrides: Partial<TArgument>): TArgument {
  return {
    _id: 'argument-1',
    parameterId: 'message',
    type: 'large-string',
    ...overrides,
  }
}

function createEffect(overrides: Partial<TEffect>): TEffect {
  return {
    _id: 'effect-1',
    targetId: 'output',
    arguments: [],
    ...overrides,
  }
}

function createMission(overrides: Partial<TMission>): TMission {
  return {
    _id: 'mission-1',
    forces: [],
    effects: [],
    ...overrides,
  }
}

function createForce(effects: TEffect[]): TForce {
  return { nodes: [{ actions: [{ effects }] }] }
}

interface TArgument {
  _id: string
  parameterId: string
  type: string
  value?: unknown
}

interface TEffect {
  _id: string
  targetId: string
  arguments: TArgument[]
}

interface TForce {
  nodes: { actions: { effects: TEffect[] }[] }[]
}

interface TMission {
  _id: string
  deleted?: boolean
  forces: TForce[]
  effects: TEffect[]
}

type TMissionFind = (filter: Record<string, never>) => {
  hasNext: () => boolean
  next: () => TMission
}

type TMissionUpdateOne = (
  filter: { _id: string },
  payload: { $set: Pick<TMission, 'forces' | 'effects'> },
) => void

type TInfosUpdateOne = (
  filter: Record<string, never>,
  payload: { $set: { schemaBuildNumber: number } },
) => void

interface TMongoshGlobals {
  use: ReturnType<typeof jest.fn>
  print: ReturnType<typeof jest.fn>
  db: {
    missions: {
      find: ReturnType<typeof jest.fn>
      updateOne: ReturnType<typeof jest.fn>
    }
    infos: {
      updateOne: ReturnType<typeof jest.fn>
    }
  }
}
