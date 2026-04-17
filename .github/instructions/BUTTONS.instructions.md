# METIS: Buttons Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for adding interactive buttons to METIS components.

## 1. Overview

METIS has two button families:

- **`ButtonText`** — A traditional HTML `<button>` that renders text inside brackets, e.g. `[ Submit ]`. Use it for standalone text actions where an icon is not appropriate: login forms, lobby actions, error recovery pages.
- **`ButtonSvg`** — An icon button powered by the **engine pattern**. Preferred whenever an icon can represent the action.

`ButtonSvg` is never rendered directly. Instead, three pieces work together:

1. **`useButtonSvgEngine`** — A hook that creates a `ButtonSvgEngine` instance tied to React state.
2. **`ButtonSvgEngine`** — Manages a collection of panel elements (buttons, dividers, steppers, text) and triggers re-renders when they change.
3. **`ButtonSvgPanel`** — A component that takes an engine and renders all of its elements.

```tsx
// ButtonText — simple, standalone
<ButtonText text='Join' onClick={onJoin} />

// ButtonSvg — always through the engine pattern
const engine = useButtonSvgEngine({ elements: [{ key: 'save', type: 'button', icon: 'save', onClick: onSave }] })
// ...
<ButtonSvgPanel engine={engine} />
```

---

## 2. Simple Single-Component Usage

When buttons are created and rendered in the same component, pass the element definitions inline to `useButtonSvgEngine` and render the engine with `ButtonSvgPanel`. This is the most straightforward pattern.

```tsx
/* -- STATE -- */

const toolbarEngine = useButtonSvgEngine({
  elements: [
    { key: 'bold', type: 'button', icon: 'bold', onClick: onClickBold },
    { key: 'italic', type: 'button', icon: 'italic', onClick: onClickItalic },
    { key: 'undo', type: 'button', icon: 'undo', onClick: onClickUndo },
  ],
})

/* -- FUNCTIONS -- */

// Callbacks go here.

/* -- RENDER -- */

return (
  <div className='Toolbar'>
    <ButtonSvgPanel engine={toolbarEngine} />
  </div>
)
```

See `RichText.tsx` for the canonical example — it creates two separate engines (bubble toolbar and floating toolbar), each with their own `ButtonSvgPanel`.

---

## 3. Cross-Component Usage

When buttons need to be managed across multiple components — created in one place, contributed to from another, and rendered elsewhere — two sub-patterns apply.

### 3a. Engine-as-Prop with `useButtonSvgs`

A parent creates the engine and passes it as a prop. The child calls `useButtonSvgs(engine, ...elements)` to contribute its own buttons into the shared engine. The parent renders `<ButtonSvgPanel>`, in this example. However, the child could be responsible for rendering if necessary.

```tsx
// Parent — creates and renders
const navEngine = useButtonSvgEngine({ elements: [] })

return <Navigation buttonEngine={navEngine} />
// Navigation renders <ButtonSvgPanel engine={buttonEngine} /> internally
```

```tsx
// Child — contributes buttons to the parent's engine
function Navigation({ buttonEngine }: TNavigation_P) {
  useButtonSvgs(buttonEngine, {
    key: 'dev-options',
    type: 'button',
    icon: 'code',
    hidden: true,
    onClick: () => setDevOptionsActive(true),
  })

  return (
    <div className='Navigation'>
      <ButtonSvgPanel engine={buttonEngine} />
    </div>
  )
}
```

This pattern is used by `SessionPage` → `Navigation` for nav buttons and `SessionPage` → `MissionMap` for map controls (zoom, preferences).

### 3b. Dynamic Runtime Addition

When button availability depends on runtime conditions, create an empty engine and add buttons imperatively inside functions.

```tsx
const navEngine = useButtonSvgEngine({ elements: [] })

const initializeNavigation = () => {
  if (canReset) {
    navEngine.add({
      key: 'reset',
      type: 'button',
      icon: 'reset',
      description: 'Reset session',
      onClick: onReset,
    })
  }
  navEngine.add({
    key: 'quit',
    type: 'button',
    icon: 'quit',
    description: 'Quit',
    onClick: onQuit,
  })
}
```

After creation, engine methods can update button state. All methods return `this` for chaining:

- `.disable(key)` / `.enable(key)` / `.setDisabled(key, condition)` — Toggle interactivity
- `.hide(key)` / `.reveal(key)` / `.setHidden(key, condition)` — Toggle visibility
- `.setDescription(key, text)` / `.setButtonIcon(key, icon)` — Update content
- `.modifyClassList(key, callback)` — Modify CSS classes on a specific element

```tsx
// Chained state updates
navEngine.disable('stop').disable('reset')
```

---

## 4. Layout

By default, elements render in insertion order. Use a layout to reposition elements and insert dividers. Layouts are set either through `options.layout` at creation or via the `useButtonSvgLayout` hook.

- `'<slot>'` — Placeholder for all elements not explicitly positioned in the layout.
- `'<divider>'` — A visual separator between groups. Only visible when elements exist on both sides.

```tsx
// Via options at creation
const engine = useButtonSvgEngine({
  elements: [, /* ... */ HomeButton(), ProfileButton()],
  options: {
    layout: ['<slot>', '<divider>', 'home', 'profile'],
  },
})

// Via hook (when the child contributing buttons differs from the creator)
useButtonSvgLayout(engine, '<slot>', 'zoom-in', 'zoom-out', 'preferences')
```

Only one layout may be applied per engine. `useButtonSvgLayout` throws if the engine already has a custom layout.

---

## 5. Pre-built Button Factories

`HomeButton()` and `ProfileButton()` are factory functions (not components) exported from `Navigation.tsx`. They return element config objects ready to be passed into an engine's `elements` array.

```tsx
const engine = useButtonSvgEngine({
  elements: [
    { key: 'save', type: 'button', icon: 'save', onClick: onSave },
    HomeButton(),
    ProfileButton({ middleware: async () => await enforceSavePrompt() }),
  ],
  options: { layout: ['<slot>', '<divider>', 'home', 'profile'] },
})
```

---

## 6. Import Paths

```tsx
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import {
  useButtonSvgEngine,
  useButtonSvgs,
  useButtonSvgLayout,
} from '@client/components/content/user-controls/buttons/panels/hooks'
import { ButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/engines'
import {
  HomeButton,
  ProfileButton,
} from '@client/components/content/general-layout/Navigation'
```
