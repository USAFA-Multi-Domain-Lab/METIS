import { useOutputRenderer } from '@client/components/content/session/output/messages/renderers'
import type { ClientOutput } from '@client/missions/forces/ClientOutput'
import { renderHook } from '@testing-library/react'

// The hook takes its output from the surrounding provider and re-renders on
// countdown ticks. Neither is what these cases are about, so the output is
// handed over directly and the tick listener does nothing.
const mockUseOutputContext = jest.fn()

jest.mock('@client/components/content/session/output/Output', () => ({
  __esModule: true,
  useOutputContext: () => mockUseOutputContext(),
}))

jest.mock('@client/toolbox/hooks', () => ({
  __esModule: true,
  useEventListener: () => {},
}))

describe('useOutputRenderer', () => {
  beforeEach(() => {
    mockUseOutputContext.mockReset()
  })

  test('renders a message containing a script without it', () => {
    let rendered = renderMessage(
      createOutput({
        message: '<p>Briefing</p><script>alert("xss")</script>',
      }),
    )

    expect(rendered).toContain('Briefing')
    expect(rendered).not.toContain('<script')
    expect(rendered).not.toContain('alert(')
  })

  test('places a name containing angle brackets as text rather than markup', () => {
    let rendered = renderMessage(
      createOutput({
        message: '<p>Reporting: <node-name></node-name></p>',
        sourceNode: { name: 'Node <b>One</b>' },
      }),
    )

    // The name reads as it was written, so the brackets are escaped rather
    // than turning the rest of the message bold.
    expect(rendered).toContain('&lt;b&gt;One&lt;/b&gt;')
    expect(rendered).not.toContain('<b>')
  })

  test('places an action description as HTML and keeps its formatting', () => {
    let rendered = renderMessage(
      createOutput({
        message: '<p><action-description></action-description></p>',
        sourceAction: createAction({
          description: '<strong>Breach</strong> the perimeter',
        }),
      }),
    )

    expect(rendered).toContain('<strong>Breach</strong>')
  })

  test('sanitizes the message after the injected values are placed', () => {
    let rendered = renderMessage(
      createOutput({
        message: '<p>Before <action-description></action-description> after</p>',
        sourceAction: createAction({
          description: '<img src="x" onerror="alert(1)" />',
        }),
      }),
    )

    // The description goes in as HTML, so the only thing that can remove this
    // is a sanitize pass that runs once the value is already in the message.
    expect(rendered).toContain('Before')
    expect(rendered).toContain('after')
    expect(rendered).not.toContain('onerror')
    expect(rendered).not.toContain('<img')
  })
})

function renderMessage(output: ClientOutput): string {
  mockUseOutputContext.mockReturnValue({
    output,
    root: { current: null },
    state: {},
  })

  let { result } = renderHook(() => useOutputRenderer())

  return result.current.renderedMessage
}

function createAction(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Action One',
    description: '',
    successChanceFormatted: '50%',
    processTimeFormatted: '30s',
    resourceCostFormatted: '5',
    opensNodeFormatted: 'No',
    ...overrides,
  }
}

function createOutput(overrides: Record<string, unknown> = {}): ClientOutput {
  return {
    message: '',
    sourceNode: { name: 'Node One' },
    sourceAction: createAction(),
    sourceExecution: {
      state: 'complete',
      timeRemainingFormatted: '0s',
      timeRemaining: 0,
      mission: null,
    },
    ...overrides,
  } as unknown as ClientOutput
}
