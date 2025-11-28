import type { ClientMission } from '@client/missions/ClientMission'
import { useEventListener } from '@client/toolbox/hooks'
import type { TSingleTypeMapped } from '@shared/toolbox/objects/ObjectToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useEffect, useState } from 'react'
import type { TOutputRendererResults, TOutputTag, TOutputTagRenderer } from '..'
import { useOutputContext } from '../Output'

/**
 * Defaults a value if it or its parent is null, undefined, or an empty string.
 * @param parent The parent object containing the value.
 * @param valueKey The key where the value is located within the parent object.
 * @param defaultValue The value to use if the value or its parent is null,
 * undefined, or an empty string.
 * @returns The defaulted value.
 */
function defaultTo<T extends Object>(
  parent: T | null | undefined | '',
  valueKey: keyof T,
  defaultValue: string = 'N/A',
): string {
  if (
    parent === null ||
    parent === undefined ||
    parent === '' ||
    parent[valueKey] === null ||
    parent[valueKey] === undefined ||
    parent[valueKey] === ''
  ) {
    return defaultValue
  } else {
    return `${parent[valueKey]}`
  }
}

/**
 * Renders HTML tags in the output message to
 * their respective values.
 */
const tagRenderers: TSingleTypeMapped<TOutputTag, TOutputTagRenderer> = {
  'resource-label': ({ mission }) => {
    return mission.resourceLabel
  },
  'node-name': ({ sourceNode }) => {
    return defaultTo(sourceNode, 'name')
  },
  'action-name': ({ sourceAction }) => {
    return defaultTo(sourceAction, 'name')
  },
  'action-description': ({ sourceAction }) => {
    return defaultTo(
      sourceAction,
      'description',
      '<i>No description provided.</i>',
    )
  },
  'success-chance': ({ sourceAction }) => {
    return defaultTo(sourceAction, 'successChanceFormatted')
  },
  'process-time': ({ sourceAction }) => {
    return defaultTo(sourceAction, 'processTimeFormatted')
  },
  'time-remaining': ({ sourceExecution }) => {
    return defaultTo(sourceExecution, 'timeRemainingFormatted')
  },
  'resource-cost': ({ sourceAction }) => {
    return defaultTo(sourceAction, 'resourceCostFormatted')
  },
  'opens-node': ({ sourceAction }) => {
    return defaultTo(sourceAction, 'opensNodeFormatted')
  },
  'execution-state': ({ sourceExecution }) => {
    return defaultTo(sourceExecution, 'state')
  },
}

/**
 * Utilizes the context of an output to render its
 * message, processing the dynamic HTML tags, and
 * yielding the resulting HTML.
 * @returns The results containing a key and the rendered message.
 * The key should be used when rendering the `RichText` component
 * displaying the message. That way, if the message changes, the
 * `RichText` component will re-render.
 */
export function useOutputRenderer(): TOutputRendererResults {
  /* -- STATE -- */

  const [key, setKey] = useState<string>(() => StringToolbox.generateRandomId())
  const [renderedMessage, setRenderedMessage] = useState<string>('')
  const { output } = useOutputContext()
  const { sourceExecution } = output
  const [listenerTarget, setListenerTarget] = useState<ClientMission | null>(
    sourceExecution?.mission ?? null,
  )
  const [tagRenders] = useState<string[]>(() => {
    return Object.values(tagRenderers).map((renderer) => renderer(output))
  })

  /* -- FUNCTIONS -- */

  /**
   * Creates an HTML document from the output message.
   * Then, it selects all tags in the document and
   * replaces them with their respective values.
   */
  const injectTags = () => {
    // Create a new HTML document from the message.
    const parse = new DOMParser()
    const doc = parse.parseFromString(output.message, 'text/html')

    // Render each tag.
    Object.keys(tagRenderers).forEach((tag, index) => {
      const elms = doc.querySelectorAll(tag)

      for (const oldElm of elms) {
        oldElm.innerHTML = tagRenders[index]
        oldElm.replaceWith(...oldElm.childNodes)
      }

      // If the tag is 'time-remaining', then
      // enable/disable listening for countdown
      // events based on whether the tag is present
      // in the message HTML.
      if (tag === 'time-remaining') {
        setListenerTarget(elms.length ? sourceExecution?.mission ?? null : null)
      }
    })

    // Set the key to a random string and the
    // rendered message to the resulting HTML
    // of the body.
    setKey(StringToolbox.generateRandomId())
    setRenderedMessage(doc.body.innerHTML)
  }

  /**
   * Renders the given tags.
   * @param tags The tags to render.
   */
  const renderTags = (tags: TOutputTag[]) => {
    Object.entries(tagRenderers).forEach(([tag, renderer], index) => {
      // If the tag is in the list of tags to render,
      // render it.
      if (tags.includes(tag as TOutputTag)) {
        tagRenders[index] = renderer(output)
      }
    })
  }

  /* -- EFFECTS -- */

  // Re-render the tags when the output or the
  // output message changes.
  useEffect(injectTags, [output, output.message])

  // Re-render the tags when there is a countdown
  // event.
  useEventListener(
    listenerTarget,
    'execution-tick',
    () => {
      // Re-render the 'time-remaining' tag.
      renderTags(['time-remaining'])
      // Re-inject the tags into the message.
      injectTags()
      // If the source execution has completed,
      // stop listening for countdown events.
      if (sourceExecution?.timeRemaining === 0) {
        setListenerTarget(null)
      }
    },
    [output, output.message],
  )

  return { key, renderedMessage }
}
