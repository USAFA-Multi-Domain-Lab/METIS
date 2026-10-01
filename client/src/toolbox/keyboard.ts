import { getOs } from '@client/toolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'

/**
 * Every keyboard shortcut METIS answers to. Defining the keystroke here
 * rather than inside each handler keeps the shortcuts consistent with one
 * another and makes the full set readable in one place.
 */
export const KEYBOARD_SHORTCUTS = {
  /**
   * Saves the page currently being edited.
   */
  save: buildShortcut({ label: 'Save', keys: 's', usesModifier: true }),
  /**
   * Turns the selected rich text into a link, or removes the link it
   * already is.
   */
  toggleRichTextLink: buildShortcut({
    label: 'Toggle Link',
    keys: 'k',
    usesModifier: true,
  }),
  /**
   * Strips every format from the selected rich text.
   */
  clearRichTextFormatting: buildShortcut({
    label: 'Clear Formatting',
    keys: '0',
    codes: ['Digit0', 'Numpad0'],
    usesModifier: true,
    usesAlt: true,
  }),
  /**
   * Keeps the rich text toolbar on screen, or lets it hide again.
   */
  pinRichTextToolbar: buildShortcut({
    label: 'Pin Toolbar',
    keys: 'm',
    usesModifier: true,
    usesShift: true,
  }),
  /**
   * Steps the font color of the selected rich text forward one option.
   */
  cycleRichTextFontColor: buildShortcut({
    label: 'Cycle Font Color',
    keys: 'c',
    usesModifier: true,
    usesShift: true,
  }),
  /**
   * Steps the heading level of the selected rich text forward one option.
   */
  cycleRichTextHeadingLevel: buildShortcut({
    label: 'Cycle Heading Level',
    keys: 'h',
    usesModifier: true,
    usesShift: true,
  }),
  /**
   * Steps the alignment of the selected rich text forward one option.
   */
  cycleRichTextAlignment: buildShortcut({
    label: 'Cycle Alignment',
    keys: 'a',
    usesModifier: true,
    usesShift: true,
  }),
  /**
   * Steps the line spacing of the selected rich text forward one option.
   */
  cycleRichTextLineSpacing: buildShortcut({
    label: 'Cycle Line Spacing',
    keys: 'p',
    usesModifier: true,
    usesShift: true,
  }),
}

/**
 * Keys that mean whatever the feature listening for them decides they mean.
 * An entry here settles only what counts as a press, which is the key by
 * itself with no modifier held, and leaves the meaning to the handler.
 */
export const UNMODIFIED_KEYSTROKES = {
  /**
   * The enter key, pressed on its own.
   */
  enter: buildShortcut({ label: 'Enter', keys: 'Enter' }),
  /**
   * The escape key, pressed on its own.
   */
  escape: buildShortcut({ label: 'Escape', keys: 'Escape' }),
  /**
   * The down arrow key, pressed on its own.
   */
  arrowDown: buildShortcut({ label: 'Arrow Down', keys: 'ArrowDown' }),
  /**
   * The up arrow key, pressed on its own.
   */
  arrowUp: buildShortcut({ label: 'Arrow Up', keys: 'ArrowUp' }),
}

/**
 * Builds a shortcut from the keystroke that triggers it.
 * @param definition The keystroke the shortcut answers to.
 * @returns The shortcut, which can recognize itself in a keyboard event and
 * carries its keystroke written out for the user's operating system.
 */
function buildShortcut({
  label,
  keys,
  codes,
  usesModifier = false,
  usesShift = false,
  usesAlt = false,
}: TKeyboardShortcutDefinition): TKeyboardShortcut {
  // Accepted characters are stored in lower case so a keystroke can be
  // compared against them without regard to the case it reports.
  let keysAccepted = ArrayToolbox.normalize(keys).map((key) =>
    key.toLowerCase(),
  )
  let codesAccepted = ArrayToolbox.normalize(codes)

  // Cmd is the modifier on macOS and Ctrl is the modifier everywhere else.
  let isMacOs = getOs() === 'mac-os'

  return {
    label,
    keystrokeLabel: writeKeystrokeLabel({
      keys,
      usesModifier,
      usesShift,
      usesAlt,
    }),
    matches: (keystroke: TKeystroke): boolean => {
      // Check to see which modifier key is being held, if any.
      // The main modifier key for MacOs should be "Cmd" and "Ctrl"
      // for all other supported systems.
      let modifierHeld = isMacOs ? keystroke.metaKey : keystroke.ctrlKey
      let otherModifierHeld = isMacOs ? keystroke.ctrlKey : keystroke.metaKey

      // Caps lock and the shift key both change the character a letter key
      // reports, and Windows and macOS disagree about which one, so keys are
      // compared in lower case.
      let keyPressed = keystroke.key.toLowerCase()

      // The key counts when either the character it reports or the physical
      // key it sits on is one the shortcut accepts.
      let keyMatches =
        keysAccepted.includes(keyPressed) ||
        codesAccepted.includes(keystroke.code)

      // Every modifier is compared, not only the ones the shortcut uses, so
      // a larger combination never triggers a smaller one.
      return (
        keyMatches &&
        modifierHeld === usesModifier &&
        !otherModifierHeld &&
        keystroke.shiftKey === usesShift &&
        keystroke.altKey === usesAlt
      )
    },
  }
}

/**
 * Writes a keystroke out the way it is labeled on the user's keyboard, such as
 * `Cmd+Shift+M` on macOS and `Ctrl+Shift+M` everywhere else.
 * @param keystroke The keys and modifiers to write out.
 * @returns The keystroke as the user would read it.
 */
export function writeKeystrokeLabel({
  keys,
  usesModifier = false,
  usesShift = false,
  usesAlt = false,
}: TKeystrokeLabelDefinition): string {
  // Only macOS names its modifiers Cmd and Opt. Every other system, and one
  // that could not be recognized, uses Ctrl and Alt.
  let isMacOs = getOs() === 'mac-os'
  let parts: string[] = []

  if (usesModifier) parts.push(isMacOs ? 'Cmd' : 'Ctrl')
  if (usesAlt) parts.push(isMacOs ? 'Opt' : 'Alt')
  if (usesShift) parts.push('Shift')

  // A single character is written in upper case, the way it is printed on the
  // key. A named key such as Enter keeps its name.
  let [key] = ArrayToolbox.normalize(keys)
  parts.push(key.length === 1 ? key.toUpperCase() : key)

  return parts.join('+')
}

/* -- TYPES -- */

/**
 * The parts of a keyboard event a shortcut reads. Both the browser's
 * keyboard events and the ones React supplies to a component carry these,
 * so a shortcut can be matched against either.
 */
export type TKeystroke = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
>

/**
 * A keystroke the application answers to.
 */
export type TKeyboardShortcut = {
  /**
   * The name of the shortcut, written the way it would be shown to a user.
   */
  label: string
  /**
   * The keystroke, written the way it is labeled on the user's keyboard, such
   * as `Cmd+Shift+M` on macOS and `Ctrl+Shift+M` everywhere else. It is worked
   * out once, when the shortcut is built.
   */
  keystrokeLabel: string
  /**
   * Whether the given keystroke is this shortcut.
   */
  matches: (keystroke: TKeystroke) => boolean
}

/**
 * The keystroke a shortcut answers to.
 */
type TKeyboardShortcutDefinition = {
  /**
   * The name of the shortcut, written the way it would be shown to a user.
   */
  label: string
  /**
   * The characters the key reports when pressed, as the browser names them.
   * Letters are matched without regard to the case they are written in.
   */
  keys: string | string[]
  /**
   * The physical keys the shortcut also accepts, as the browser names their
   * positions. Worth naming when a modifier can change the character a key
   * reports, or when the same character sits on more than one key.
   */
  codes?: string | string[]
  /**
   * Whether Cmd or Ctrl is held down.
   * @default false
   */
  usesModifier?: boolean
  /**
   * Whether Shift is held down.
   * @default false
   */
  usesShift?: boolean
  /**
   * Whether Alt or Option is held down.
   * @default false
   */
  usesAlt?: boolean
}

/**
 * The parts of a shortcut's definition that its keystroke is written out from.
 */
export type TKeystrokeLabelDefinition = Pick<
  TKeyboardShortcutDefinition,
  'keys' | 'usesModifier' | 'usesShift' | 'usesAlt'
>
