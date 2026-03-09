# METIS: React Class Name Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for managing HTML class names in React components.

## Overview

METIS uses the `ClassList` class (`@shared/toolbox/html/ClassList`) to construct class name strings for React elements. All class name work in components should go through `ClassList` rather than plain string operations.

---

## 1. Prefer `ClassList` Over Plain String Concatenation

Never build class name strings using array joins, template literals, or conditional string concatenation. Always use `ClassList`.

```ts
// ❌ Avoid
const className = ['Field', disabled ? 'Disabled' : '']
  .filter(Boolean)
  .join(' ')

// ✅ Prefer
const fieldClasses = new ClassList('Field').set('Disabled', disabled)
```

---

## 2. Naming — Use `Classes` as a Suffix

Variable names for `ClassList` instances used in components should be suffixed with `Classes` to make their purpose clear at a glance.

```ts
// ❌ Avoid
const root = new ClassList('Detail', 'DetailString')
const fieldClassName = new ClassList('Field')

// ✅ Prefer
const rootClasses = new ClassList('Detail', 'DetailString')
const fieldClasses = new ClassList('Field')
```

---

## 3. Chain Calls

`ClassList` methods (`add`, `remove`, `set`, `switch`, `toggle`, `import`) all return `this`, enabling fluent chaining. Build the full list in one expression rather than reassigning or calling methods on separate lines.

```ts
// ❌ Avoid
const fieldClasses = new ClassList('Field')
fieldClasses.add('FieldDropdown')
fieldClasses.set('IsExpanded', expanded)
fieldClasses.set('Disabled', disabled)

// ✅ Prefer
const fieldClasses = new ClassList('Field', 'FieldDropdown')
  .set('IsExpanded', expanded)
  .set('Disabled', disabled)
```

When component-specific classes must be appended after a shared hook produces the base list (e.g. `useDetailClassNames`), those post-hook `.set()` / `.add()` calls should immediately follow the destructuring — before any other logic or JSX — and may remain on separate lines for readability.

---

## 4. `set` Accepts Any Truthy Value — No Need to Cast to Boolean

The `set(classes, condition)` method internally calls `Boolean(condition)`, so any truthy value can be passed directly as the condition. There is no need to coerce values to `boolean` first.

```ts
let selection: Object | null = {}

// ❌ Unnecessary coercion
classList.set('ItemSelected', !!selection)
classList.set('ItemSelected', Boolean(selection))

// ✅ Pass the value directly
classList.set('ItemSelected', selection)
```

## 5. Empty Strings Are Ignored — No Need for Conditional Logic to Avoid Them

This is particularly useful when conditionally adding an optional class name: pass the string itself as both the class and the condition.

```ts
let uniqueClassName = ''
// ❌ No need to check if empty before adding.
classList.set(uniqueClassName, uniqueClassName)
```

```ts
// ✅ Just add it directly — empty string will be ignored.
let uniqueClassName = ''
new ClassList('Root', uniqueClassName)
```

However, if the class name may be `undefined`, default it to `''` in the parameter destructuring (or pass it via the constructor) to avoid a type error on the first argument, which requires `string | string[]`.

```ts
// Default in destructuring so the type is always `string`
function example({ uniqueClassName = '' }: { uniqueClassName?: string }) {
  const rootClasses = new ClassList('Root', uniqueClassName)
}
```

---

## 6. Pass Static Classes Through the Constructor

Static classes that are always present should be passed directly to the `ClassList` constructor rather than added with `.add()` after construction. The constructor accepts any number of string arguments and silently ignores empty strings.

```ts
// ❌ Avoid
const fieldClasses = new ClassList('Field')
fieldClasses.add('FieldDropdown')

// ✅ Prefer
const fieldClasses = new ClassList('Field', 'FieldDropdown')
```

---

## 7. Extracting Shared Class Logic Into a Hook

When multiple components share the same class name structure, extract the shared logic into a plain function (named with the `use` prefix by convention, though no React hooks need be involved). The function should return `ClassList` instances — not strings — so callers can chain additional component-specific classes before reading `.value`.

```tsx
// Hook returns ClassList objects, not strings
const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
  useDetailClassNames({
    componentName: 'DetailString',
    disabled,
    displayError,
    errorType,
  })

// Caller appends component-specific classes immediately after
fieldClasses.set('Password', inputType === 'password')

// .value is only read in JSX
return <div className={rootClasses.value}>...</div>
```

---

## 8. Read `.value` Only in JSX

`.value` (equivalently, `.toString()`) should be called only at the point of passing the string to a `className` prop. Avoid storing `.value` in a separate variable — keep the `ClassList` object alive so it can be extended if needed.

```tsx
// ❌ Avoid
const rootClassName = rootClasses.value
return <div className={rootClassName}>

// ✅ Prefer
return <div className={rootClasses.value}>
```
