# METIS: LocalContext Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for using `LocalContext` to share state across a component tree in METIS.

## Overview

`LocalContext` (`@client/context/local`) is a typed wrapper around React context designed for components that own subcomponents needing access to the parent's props, computed values, state, and element refs. It provides a structured, type-safe alternative to prop-drilling.

The pattern has four parts: defining types, creating the context, wrapping the root component's JSX in a provider, and consuming the context in subcomponents via a generated hook.

---

## 1. Define the Four Type Slots

Every `LocalContext` instance is parameterized by four types. Define them as named types at the bottom of the root component's file using the `T{ComponentName}_P/C/S/E` naming convention.

| Type suffix | Purpose                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `_P`        | The component's **props** (as declared on the component function)                  |
| `_C`        | **Computed** values derived from props/state that are passed to children           |
| `_S`        | Consolidated **state** — a plain object whose every value is a `TReactState` tuple |
| `_E`        | **Element** refs — `React.RefObject` handles shared across the tree                |

```ts
/**
 * Props for {@link MyComponent}.
 */
export type TMyComponent_P = {
  /**
   * The mission to display.
   */
  mission: ClientMission
  /**
   * Handles when a node is selected.
   * @default null
   */
  onNodeSelect?: ((node: ClientMissionNode) => void) | null
}

/**
 * Computed values derived from props and state for {@link MyComponent}.
 */
export type TMyComponent_C = {
  /**
   * Centers the camera on the position of the given node.
   * @param node The node to center on.
   */
  centerOnMap: (node: TMapCompatibleNode) => void
}

/**
 * Consolidated state for {@link MyComponent}.
 */
export type TMyComponent_S = {
  /**
   * The currently selected force.
   */
  selectedForce: TReactState<ClientMissionForce | null>
  /**
   * The number of modals currently active.
   */
  modalCount: TReactState<number>
}

/**
 * Element refs shared across the {@link MyComponent} tree.
 */
export type TMyComponent_E = {
  /**
   * The root element of the component.
   */
  root: React.RefObject<HTMLDivElement | null>
  /**
   * The scene element of the component.
   */
  scene: React.RefObject<HTMLDivElement | null>
}
```

---

## 2. Create the Context and Export the Hook

Instantiate `LocalContext` once as a module-level constant. Then export a typed hook from `getHook()` so subcomponents can import it directly.

```ts
import { LocalContext } from '@client/context/local'

/**
 * Context for MyComponent, distributing props, computed values,
 * state, and element refs to its subcomponents.
 */
const myContext = new LocalContext<
  TMyComponent_P,
  TMyComponent_C,
  TMyComponent_S,
  TMyComponent_E
>()

/**
 * Hook used by MyComponent subcomponents to access
 * the MyComponent context.
 */
export const useMyContext = myContext.getHook()
```

Keep both declarations near the top of the file, after any constants and before the component function.

---

## 3. Populate and Provide in the Root Component

Inside the root component function, assemble the four buckets as typed objects and pass them to `LocalContextProvider`. Wrap the entire JSX return in the provider.

```tsx
import { LocalContextProvider } from '@client/context/local'

/**
 * A component that [describe the component's purpose].
 */
export default function MyComponent(props: TMyComponent_P) {
  const defaultedProps = useDefaultProps(props, {
    onNodeSelect: null,
    // ...other defaults
  })

  // Elements
  const elements: TMyComponent_E = {
    root: useRef<HTMLDivElement>(null),
    scene: useRef<HTMLDivElement>(null),
  }

  // State
  const state: TMyComponent_S = {
    selectedForce: useState<ClientMissionForce | null>(null),
    modalCount: useState<number>(0),
  }

  /**
   * Centers the camera on the position of the given node.
   * @param node The node to center on.
   */
  const centerOnMap = (node: TMapCompatibleNode): void => {
    /* ... */
  }

  const computed: TMyComponent_C = {
    centerOnMap,
  }

  return (
    <LocalContextProvider
      context={myContext}
      defaultedProps={defaultedProps}
      computed={computed}
      state={state}
      elements={elements}
    >
      {/* subcomponents rendered here */}
    </LocalContextProvider>
  )
}
```

**Key rule**: `defaultedProps` must be the result of `useDefaultProps` — not the raw `props` object — so that the `Required<TProps>` constraint is satisfied.

---

## 4. Consume the Context in Subcomponents

Subcomponents call the exported hook and destructure only what they need. Props, computed values, state tuples, and element refs are all available on the single object returned by the hook.

```tsx
/**
 * Title bar for {@link MyComponent}.
 */
export default function TitleBar() {
  const { mission, buttonEngine } = useMyContext()
  // ...
}

/**
 * A node rendered on the map.
 */
export default function MapNode() {
  const { centerOnMap, state } = useMyContext()
  const [nodeContentVisible] = state.nodeContentVisible
  // ...
}

/**
 * Hook for registering a modal within the {@link MyComponent} tree.
 * Increments the modal count on mount and decrements it on unmount.
 */
export function useModal() {
  const { state } = useMyContext()
  const [, setModalCount] = state.modalCount
  // increment on mount, decrement on unmount
}
```

---

## 5. Checklist for Adding LocalContext to a New Component

- [ ] Define `T{Name}_P`, `T{Name}_C`, `T{Name}_S`, and `T{Name}_E` types at the bottom of the root component file.
- [ ] Instantiate `LocalContext` once at module scope with a docstring.
- [ ] Export the hook from `myContext.getHook()` with a docstring, and name it `use{Name}Context`.
- [ ] Inside the root component, build `elements`, `state`, and `computed` objects typed to their respective types.
- [ ] Pass `defaultedProps` (from `useDefaultProps`) — not raw `props` — to `LocalContextProvider`.
- [ ] Wrap the JSX return in `<LocalContextProvider ... >`.
- [ ] In each subcomponent, call the hook and destructure only the needed values.
