import { useGlobalContext } from '@client/context/global'
import type { Editor } from '@tiptap/react'

/**
 * Asks for a URL and applies it to the current text selection.
 * @returns The function that puts the link prompt up.
 */
export function useRichTextLinkPrompt(): (editor: Editor) => Promise<void> {
  const prompt = useGlobalContext()?.actions?.prompt

  return async (editor: Editor) => {
    if (!prompt) {
      throw new Error(
        'A link cannot be added from rich text placed outside the global context.',
      )
    }

    const hasLink = editor.isActive('link')
    const prevUrl = hasLink ? (editor.getAttributes('link').href as string) : ''

    const choices = hasLink
      ? (['Cancel', 'Remove', 'Submit'] as ['Cancel', 'Remove', 'Submit'])
      : (['Cancel', 'Submit'] as ['Cancel', 'Submit'])

    const { choice, text: url } = await prompt('', choices, {
      textField: {
        boundChoices: ['Submit'],
        label: 'URL',
        initialValue: prevUrl,
      },
      dangerousChoices: hasLink ? ['Remove'] : [],
      defaultChoice: 'Submit',
    })

    if (choice === 'Remove') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (choice === 'Submit') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }
}
