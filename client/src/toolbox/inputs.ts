// handles KEYBOARD EVENTS for
// TEXTAREA elements, adding
// indentation to the value rather
// than moving to the next selectable
// element in the browser
export const enforceIndentOnTabDown = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
): void => {
  if (event.key === 'Tab') {
    let targetElement = event.target as HTMLTextAreaElement
    event.preventDefault()
    let start = targetElement.selectionStart
    let end = targetElement.selectionEnd
    // set textarea value to: text before caret + tab + text after caret
    targetElement.value =
      targetElement.value.substring(0, start) +
      '\t' +
      targetElement.value.substring(end)
    // put caret at right position again
    targetElement.selectionStart = targetElement.selectionEnd = start + 1
  }
}

export const enforceNumbericCharsOnly = (
  event: React.KeyboardEvent<HTMLInputElement>,
): void => {
  // Allow: Ctrl/Cmd + A (select all)
  if (
    (event.ctrlKey || event.metaKey) &&
    (event.key === 'a' || event.key === 'A')
  ) {
    return
  }
  const condition: RegExp = /[0-9+-.]/
  let key: string = event.key
  let validKey: boolean = key.length > 1 || condition.test(key)
  if (!validKey) {
    event.preventDefault()
  }
}

export const enforceIntegersOnly = (
  event: React.KeyboardEvent<HTMLInputElement>,
): void => {
  if (event.key === '.') {
    event.preventDefault()
  }
}

export const enforceNonNegativeOnly = (
  event: React.KeyboardEvent<HTMLInputElement>,
): void => {
  if (event.key === '-' || event.key === '+') {
    event.preventDefault()
  }
}

export const enforceNumberFloor = (
  event: React.ChangeEvent<HTMLInputElement>,
  floor: number,
): void => {
  let eventTarget: HTMLInputElement = event.target as HTMLInputElement
  // if (eventTarget.type === 'number') {
  let updatedValue = eventTarget.value
  let updatedValueAsFloat = parseFloat(updatedValue)
  if (!isNaN(updatedValueAsFloat) && updatedValueAsFloat < floor) {
    event.preventDefault()
    eventTarget.value = `${floor}`
  }
  // } else {
  //   let error = new Error("can't enforce a number cap on a non-number input")
  //   console.error(error)
  // }
}

export const enforceNumberCap = (
  event: React.ChangeEvent<HTMLInputElement>,
  cap: number,
): void => {
  let eventTarget: HTMLInputElement = event.target as HTMLInputElement
  // if (eventTarget.type === 'number') {
  let updatedValue = eventTarget.value
  let updatedValueAsFloat = parseFloat(updatedValue)
  if (!isNaN(updatedValueAsFloat) && updatedValueAsFloat > cap) {
    event.preventDefault()
    eventTarget.value = `${cap}`
  }
  // } else {
  //   let error = new Error("can't enforce a number cap on a non-number input")
  //   console.error(error)
  // }
}

export const enforceNonNullValues = (
  event: React.ChangeEvent<HTMLInputElement>,
): void => {
  let eventTarget: HTMLInputElement = event.target as HTMLInputElement
  if (!eventTarget.value || eventTarget.value === '') {
    eventTarget.value = `${0}`
  } else if (eventTarget.value.startsWith('0') && eventTarget.value !== '0') {
    eventTarget.value = eventTarget.value.substr(
      1,
      eventTarget.value.length - 1,
    )
  }
}

export const enforceNoSpacing = (event: React.ChangeEvent) => {
  let eventTarget: HTMLInputElement = event.target as HTMLInputElement
  while (eventTarget.value.includes(' ')) {
    eventTarget.value = eventTarget.value.replace(' ', '')
  }
}

// handles KEYBOARD events for
// INPUT elements, removing any
// characters that wouldn't be used
// in a name
export const enforceNameFormat = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  const condition: RegExp = /[-'a-zA-ZÀ-ÖØ-öø-ÿ]/
  let key: string = event.key
  let validKey: boolean = condition.test(key)
  if (!validKey) {
    event.preventDefault()
  }
}

// handles CHANGE events for
// INPUT elements, forcing
export const enforceNameCasing = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  let target: HTMLInputElement = event.target as HTMLInputElement
  let value: string = target.value
  if (value.length > 0) {
    let firstChar: string = value[0]
    let afterFirstChar: string = value.substr(1, value.length)
    target.value = firstChar.toUpperCase() + afterFirstChar // .toLowerCase()
  }
}

// handles CHANGE EVENTS for
// INPUT elements, removing
// spacing at the start of the
// input value
export const enforceNoSpacedBeginnings = <
  T extends React.KeyboardEvent | React.ChangeEvent,
>(
  event: T,
) => {
  let eventTarget: HTMLInputElement = event.target as HTMLInputElement
  let condition: RegExp = /^\s/
  while (condition.test(eventTarget.value)) {
    eventTarget.value = eventTarget.value.replace(condition, '')
  }
}

// export const enforceHtmlMaxLength = (maxLength: number) => {
//   return <TElement extends EventTarget & { innerText: string }>(
//     event: React.KeyboardEvent<TElement> | React.ClipboardEvent<TElement>,
//   ): void => {
//     let eventTarget: TElement = event.target as TElement
//     let keyboardEvent: React.KeyboardEvent<TElement> =
//       event as React.KeyboardEvent<TElement>
//     let clipboardEvent: React.ClipboardEvent<TElement> =
//       event as React.ClipboardEvent<TElement>
//     let length: number = eventTarget.innerText.length
//     if (clipboardEvent.clipboardData) {
//       console.log('clipboard event')
//       let pasted: string = clipboardEvent.clipboardData.getData('text')
//       if (pasted) {
//         length += pasted.length
//       }
//     } else if (keyboardEvent.key) {
//       console.log('keyboard event')
//       length += 1
//     }
//     if (length >= maxLength) {
//       event.preventDefault()
//     }
//   }
// }

// Takes the div and inserts the "insertion"
// at wherever the cursor currently is at.
function insertTextAtSelection(div: HTMLDivElement, insertion: string) {
  //get selection area so we can position insert
  let selection: Selection | null = window.getSelection()
  let text: string | null = div.textContent
  if (selection && text) {
    let before = Math.min(selection.focusOffset, selection.anchorOffset)
    let after = Math.max(selection.focusOffset, selection.anchorOffset)
    //ensure string ends with \n so it displays properly
    let afterStr = text.substring(after)
    if (afterStr === '') afterStr = '\n'
    //insert content
    div.textContent = text.substring(0, before) + insertion + afterStr
    //restore cursor at correct position
    selection.removeAllRanges()
    let range = document.createRange()
    //childNodes[0] should be all the text
    range.setStart(div.children[0], before + insertion.length)
    range.setEnd(div.children[0], before + insertion.length)
    selection.addRange(range)
  }
}

export const enforceCleanNewLines = (
  event: React.KeyboardEvent<HTMLDivElement>,
): void => {
  if (event.key === 'Enter') {
    let div: HTMLDivElement = event.target as HTMLDivElement
    event.preventDefault()
    event.stopPropagation()
    insertTextAtSelection(div, '\n')
  }
}

export const enforceCleanPastes = (
  event: React.ClipboardEvent<HTMLDivElement>,
): void => {
  // event.preventDefault()
  // const text = event.clipboardData.getData('text')
  // document.execCommand('insertText', false, text)
  event.preventDefault()
  let text: string = event.clipboardData.getData('text/plain')
  let div: HTMLDivElement = event.target as HTMLDivElement
  insertTextAtSelection(div, text)
}

let defaultExports = {
  enforceIndentOnTabDown,
  enforceNumbericCharsOnly,
  enforceIntegersOnly,
  enforceNonNegativeOnly,
  enforceNumberFloor,
  enforceNumberCap,
  enforceNonNullValues,
  enforceNoSpacing,
  enforceNoSpacedBeginnings,
  enforceNameFormat,
  enforceNameCasing,
  enforceCleanNewLines,
  enforceCleanPastes,
}

export default defaultExports
