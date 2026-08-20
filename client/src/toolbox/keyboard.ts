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
}

/**
 * Builds a shortcut from the keystroke that triggers it.
 * @param definition The keystroke the shortcut answers to.
 * @returns The shortcut, which can recognize itself in a keyboard event.
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

  return {
    label,
    matches: (keystroke: TKeystroke): boolean => {
      // Cmd on macOS and Ctrl everywhere else act as the same modifier.
      let modifierHeld = keystroke.ctrlKey || keystroke.metaKey

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
        keystroke.shiftKey === usesShift &&
        keystroke.altKey === usesAlt
      )
    },
  }
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
