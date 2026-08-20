import type { TButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/types'
import { getOs } from '@client/toolbox'
import type { Editor } from '@tiptap/react'
import type { ButtonSvgEngine } from '../../../../user-controls/buttons/panels/engines'
import { useButtonSvgEngine } from '../../../../user-controls/buttons/panels/hooks'
import { isFontColorActive } from '../helpers/font-color'
import { isLineSpacingActive } from '../helpers/line-spacing'
import { isTextAlignActive } from '../helpers/text-align'
import { useRichTextLinkPrompt } from './useRichTextLinkPrompt'
import type { TRichTextToolbarControls } from './useRichTextToolbar'

/**
 * Builds the toolbar's buttons and keeps their highlighting in step
 * with what the editor has applied at the cursor.
 */
export function useRichTextToolbarButtons({
  editor,
  toolbar,
}: TRichTextToolbarButtons_P): TRichTextToolbarButtons {
  // The link prompt reaches for the global context, so it has to be taken
  // here while the toolbar is rendering rather than at the moment the link
  // button is pressed.
  const toggleLink = useRichTextLinkPrompt()

  const elements = createRichTextToolbarButtons(editor, toolbar, toggleLink)
  const buttonEngine = useButtonSvgEngine({ elements })

  return {
    buttonEngine,
    updateButtonClassNames: () =>
      updateButtonClassNames(buttonEngine, editor, toolbar),
  }
}

/**
 * Updates the class names for all buttons in the toolbar based on their active state.
 * @param engine The button engine.
 * @param editor The rich text's editor.
 * @param toolbar The rich text's toolbar.
 */
const updateButtonClassNames = (
  engine: ButtonSvgEngine,
  editor: Editor,
  toolbar: TRichTextToolbarControls,
) => {
  engine.buttons.forEach(({ key, icon }) => {
    engine.modifyClassList(key, (classList) =>
      classList.switch(
        'Selected',
        'NotSelected',
        isIconActive(editor, toolbar, icon),
      ),
    )
    engine.setDisabled(key, isButtonDisabled(editor, icon))
  })
}

/**
 * Checks if an icon is active for the current selection within the editor.
 * @param editor The rich text's editor.
 * @param toolbar The rich text's toolbar.
 * @param icon The icon to check.
 * @returns Whether the icon is active.
 */
const isIconActive = (
  editor: Editor,
  toolbar: TRichTextToolbarControls,
  icon: TMetisIcon,
): boolean => {
  // Convert any kebab-case icon names to camelCase.
  // *** Note: This is necessary because the editor
  // *** uses "camelCase" for its active state checks.
  // *** For example, 'ordered-list' becomes 'orderedList'.
  const camelCaseIcon = icon.replace(/-([a-z])/g, (g) => g[1].toUpperCase())

  // Handle icons with pickers.
  if (isIconWithPickerActive(editor, toolbar, icon)) return true

  // Check if the editor is active for the icon.
  return editor.isActive(camelCaseIcon)
}

/**
 * Checks if an icon with a picker is currently active.
 * @param editor The rich text's editor.
 * @param toolbar The rich text's toolbar.
 * @param icon The icon to check.
 * @returns Whether the icon is active.
 */
const isIconWithPickerActive = (
  editor: Editor,
  toolbar: TRichTextToolbarControls,
  icon: TMetisIcon,
): boolean => {
  const [activePicker] = toolbar.state.activePicker

  switch (icon) {
    case 'heading':
      // *** Note: heading creates a block-level element which
      // *** gets handled in the "isIconActive" function. So,
      // *** we only need to check if the heading picker is open.
      return activePicker === 'heading'
    case 'font-color':
      return activePicker === 'color' || isFontColorActive(editor)
    case 'line-spacing':
      return activePicker === 'line-spacing' || isLineSpacingActive(editor)
    case 'align-left':
    case 'align-center':
    case 'align-right':
    case 'align-justify':
      return activePicker === 'align' || isTextAlignActive(editor)
    default:
      return false
  }
}

/**
 * Checks if a button should be disabled based on the editor's capabilities.
 * @param editor The rich text's editor.
 * @param button The button to check.
 * @returns Whether the button is disabled.
 */
const isButtonDisabled = (editor: Editor, button: TMetisIcon): boolean => {
  switch (button) {
    case 'undo':
      return !editor.can().undo()
    case 'redo':
      return !editor.can().redo()
    default:
      return false
  }
}

/**
 * Returns the shortcut text for a button, worded for the keyboard that the end-user
 * is currently using.
 * @param windowsKeys The shortcut as it reads on Windows.
 * @param macKeys The shortcut as it reads on macOS.
 * @returns The shortcut text.
 */
const shortcut = (windowsKeys: string, macKeys: string): string =>
  getOs() === 'windows' ? windowsKeys : macKeys

/**
 * Every button the toolbar shows, in the order it shows them.
 * @param editor The rich text's editor.
 * @param toolbar The rich text's toolbar.
 * @param toggleLink Adds, changes, or removes the link on the current selection.
 * @returns The buttons for the toolbar's engine.
 */
function createRichTextToolbarButtons(
  editor: Editor,
  toolbar: TRichTextToolbarControls,
  toggleLink: (editor: Editor) => Promise<void>,
): Required<TButtonSvgEngine>['elements'] {
  return [
    {
      key: 'undo',
      type: 'button',
      icon: 'undo',
      label: '**Undo**',
      description: shortcut('`ctrl+z`', '`cmd+z`'),
      onClick: () => editor.commands.undo(),
    },
    {
      key: 'redo',
      type: 'button',
      icon: 'redo',
      label: '**Redo**',
      description: shortcut('`ctrl+shift+z`', '`cmd+shift+z`'),
      onClick: () => editor.commands.redo(),
    },
    {
      key: 'ordered-list',
      type: 'button',
      icon: 'ordered-list',
      label: '**Ordered List**',
      description: shortcut('`ctrl+shift+7`', '`cmd+shift+7`'),
      onClick: () => editor.commands.toggleOrderedList(),
    },
    {
      key: 'bullet-list',
      type: 'button',
      icon: 'bullet-list',
      label: '**Bullet List**',
      description: shortcut('`ctrl+shift+8`', '`cmd+shift+8`'),
      onClick: () => editor.commands.toggleBulletList(),
    },
    {
      key: 'text-align',
      type: 'button',
      icon: 'align-left',
      label: '**Text Align**',
      description: shortcut(
        '`ctrl+shift+a` to cycle',
        '`cmd+shift+a` to cycle',
      ),
      onClick: () => toolbar.togglePicker('align'),
    },
    {
      key: 'line-spacing',
      type: 'button',
      icon: 'line-spacing',
      label: '**Line Spacing**',
      description: shortcut(
        '`ctrl+shift+p` to cycle',
        '`cmd+shift+p` to cycle',
      ),
      onClick: () => toolbar.togglePicker('line-spacing'),
    },
    {
      key: 'heading',
      type: 'button',
      icon: 'heading',
      label: '**Headings**',
      description: shortcut(
        '`ctrl+shift+h` to cycle',
        '`cmd+shift+h` to cycle',
      ),
      onClick: () => toolbar.togglePicker('heading'),
    },
    {
      key: 'bold',
      type: 'button',
      icon: 'bold',
      label: '**Bold**',
      description: shortcut('`ctrl+b`', '`cmd+b`'),
      onClick: () => editor.commands.toggleBold(),
    },
    {
      key: 'italic',
      type: 'button',
      icon: 'italic',
      label: '**Italic**',
      description: shortcut('`ctrl+i`', '`cmd+i`'),
      onClick: () => editor.commands.toggleItalic(),
    },
    {
      key: 'underline',
      type: 'button',
      icon: 'underline',
      label: '**Underline**',
      description: shortcut('`ctrl+u`', '`cmd+u`'),
      onClick: () => editor.commands.toggleUnderline(),
    },
    {
      key: 'strike',
      type: 'button',
      icon: 'strike',
      label: '**Strikethrough**',
      description: shortcut('`ctrl+shift+s`', '`cmd+shift+s`'),
      onClick: () => editor.commands.toggleStrike(),
    },
    {
      key: 'font-color',
      type: 'button',
      icon: 'font-color',
      label: '**Font Color**',
      description: shortcut(
        '`ctrl+shift+c` to cycle',
        '`cmd+shift+c` to cycle',
      ),
      onClick: () => toolbar.togglePicker('color'),
    },
    {
      key: 'code',
      type: 'button',
      icon: 'code',
      label: '**Inline Code**',
      description: shortcut('`ctrl+e`', '`cmd+e`'),
      onClick: () => editor.commands.toggleCode(),
    },
    {
      key: 'code-block',
      type: 'button',
      icon: 'code-block',
      label: '**Code Block**',
      description: shortcut('`ctrl+alt+c`', '`cmd+opt+c`'),
      onClick: () => editor.commands.toggleCodeBlock(),
    },
    {
      key: 'link',
      type: 'button',
      icon: 'link',
      label: '**Link**',
      description: shortcut('`ctrl+k`', '`cmd+k`'),
      onClick: async () => await toggleLink(editor),
    },
    {
      key: 'blockquote',
      type: 'button',
      icon: 'blockquote',
      label: '**Blockquote**',
      description: shortcut('`ctrl+shift+b`', '`cmd+shift+b`'),
      onClick: () => editor.commands.toggleBlockquote(),
    },
    {
      key: 'clear-format',
      type: 'button',
      icon: 'clear-format',
      label: '**Clear Format**',
      description: shortcut('`ctrl+alt+0`', '`cmd+opt+0`'),
      onClick: () => {
        editor.commands.unsetAllMarks()
        editor.commands.clearNodes()
      },
    },
  ]
}

/* -- TYPES -- */

/**
 * What {@link createRichTextToolbarButtons} needs to build its buttons.
 */
export type TRichTextToolbarButtons_P = {
  /**
   * The editor the shortcuts act on.
   */
  editor: Editor
  /**
   * The rich text editor's toolbar that the buttons are for.
   */
  toolbar: TRichTextToolbarControls
}

/**
 * The pieces {@link useRichTextToolbarButtons} returns for the toolbar.
 */
export type TRichTextToolbarButtons = {
  /**
   * The engine holding the toolbar's buttons.
   */
  buttonEngine: ButtonSvgEngine
  /**
   * Updates every button in the toolbar.
   * @note Updates can include things like highlighting a format
   * button if the text at the cursor's location is using that same
   * format and disabling a button if its command cannot be run.
   */
  updateButtonClassNames: () => void
}
