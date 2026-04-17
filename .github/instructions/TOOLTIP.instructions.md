# METIS: Tooltip Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for using the `Tooltip` component in METIS.

## Overview

`Tooltip` (`@client/components/content/communication/Tooltip`) is a self-contained tooltip component. It mounts inside a parent element and attaches mouse event listeners to that parent. When the parent is hovered, the tooltip description is displayed in the global tooltip overlay managed by `useGlobalContext`. No positioning props are needed — the global overlay handles placement automatically.

---

## 1. Basic Usage

Render `<Tooltip>` as a direct child of the element that should trigger the tooltip on hover. The `description` prop controls what text is shown.

```tsx
<div className='MyButton'>
  Submit
  <Tooltip description='Click to submit' />
</div>
```

When `MyButton` is hovered, the tooltip displays `"Click to submit"`. When the cursor leaves, the tooltip hides automatically.

---

## 2. Empty Description Suppresses the Tooltip

If `description` is an empty string, no tooltip is shown. This makes it straightforward to conditionally suppress the tooltip by computing the description as a variable before the return statement:

```tsx
let tooltipDescription = isEnabled ? 'Perform action' : ''

return (
  <div className='MyButton'>
    Action
    <Tooltip description={tooltipDescription} />
  </div>
)
```

Do **not** conditionally include/exclude the `<Tooltip>` element itself based on whether a description exists — always render it and let the empty string suppress the display. This avoids unnecessary mount/unmount cycles.

---

## 3. Dynamic Descriptions

When the tooltip text should change based on state, compute it as a `let` variable before the return statement and pass it to `description`. The component re-registers its event listeners whenever `description` changes, so the correct text is always shown.

```tsx
let tooltipDescription = isSelected ? 'Deselect item' : 'Select item'

return (
  <div className='SelectionZone'>
    {item.name}
    <Tooltip description={tooltipDescription} />
  </div>
)
```

---

## 4. Delay

The `delay` prop controls the fade-in duration in milliseconds. It defaults to `333` and rarely needs to be changed.

```tsx
<Tooltip description='Quick tip' delay={150} />
```

---

## 5. Placement Rules

- `<Tooltip>` must be a **direct child** of the element whose hover triggers it. It listens to its immediate `parentElement` — placing it deeper in the tree will attach to the wrong element.
- Only one `<Tooltip>` should be placed per triggering element.
- Do **not** place a `<Tooltip>` inside an element that is itself a descendant of another element that already has a `<Tooltip>`. Because hover events bubble up the DOM, both tooltips will respond to the same mouse interaction, causing a conflict where the descriptions overwrite each other unpredictably.
- Try to place `<Tooltip>` **last** among the children of its triggering element, except when it interferes with styling or other competing logic.
- The tooltip is rendered into a global overlay — no additional CSS or positioning is required on the parent.

---

## 6. Import Path

```tsx
import Tooltip from '@client/components/content/communication/Tooltip'
```
