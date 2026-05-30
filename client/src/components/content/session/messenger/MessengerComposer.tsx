import { compute } from '@client/toolbox'
import { ChatMessage } from '@shared/sessions/chat/ChatMessage'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { Editor } from '@tiptap/react'
import { useRef, useState } from 'react'
import RichText from '../../general-layout/rich-text/RichText'
import ButtonSvgPanel from '../../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../../user-controls/buttons/panels/hooks'
import './MessengerComposer.scss'
import { useMessengerContext } from './MessengerPanel'

/**
 * Renders the rich text input area and send button for composing
 * chat messages in {@link MessengerPanel}.
 */
export default function MessengerComposer(): TReactElement {
  const { session, state } = useMessengerContext()
  const [activeChannelId] = state.activeChannelId

  /* -- STATE -- */

  const [charCount, setCharCount] = useState<number>(0)

  /* -- ENGINE(S) -- */

  const shortcutsEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'file',
        type: 'button',
        icon: 'file',
        description: 'Click here to view the shortcuts for this editor.',
        onClick: () => window.open('/files/shortcuts.html', '_blank'),
      },
    ],
  })

  /* -- REFS -- */

  const editorRef = useRef<Editor | null>(null)
  const composerScrollRef = useRef<HTMLDivElement | null>(null)

  /* -- COMPUTED -- */

  /**
   * Determines if the current character count exceeds the maximum allowed characters.
   */
  const isOverLimit = compute<boolean>(() => charCount > ChatMessage.MAX_CHARS)

  /**
   * Computes the class list for the character counter based on the current
   * character count and whether it exceeds the maximum allowed characters.
   */
  const characterCountClass = compute<ClassList>(() => {
    let classList = new ClassList('CharCounter')
    classList.set('OverLimit', isOverLimit)
    classList.set(
      'NearLimit',
      charCount > ChatMessage.MAX_CHARS * 0.9 && !isOverLimit,
    )
    return classList
  })

  const isSendDisabled = compute<boolean>(() => {
    return (
      !activeChannelId || isOverLimit || !editorRef.current?.getText().trim()
    )
  })

  /* -- FUNCTIONS -- */

  /**
   * Sends the current editor content as a message to the active channel.
   */
  const onSend = () => {
    if (!activeChannelId || !editorRef.current) return

    let html = editorRef.current.getHTML()
    let trimmed = editorRef.current.getText().trim()
    if (!trimmed || isSendDisabled) return

    session.sendChatMessage(activeChannelId, html)
    editorRef.current.commands.clearContent()
    setCharCount(0)
  }

  /**
   * Handles keydown events on the composer in the capture phase.
   */
  const onComposerKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault()
      e.stopPropagation()
      onSend()
    }
  }

  /* -- RENDER -- */

  return (
    <div className='Composer'>
      <div className='ComposerInput'>
        <div
          className='ComposerScroll'
          onKeyDownCapture={onComposerKeyDown}
          ref={composerScrollRef}
        >
          <RichText
            options={{
              editable: !!activeChannelId,
              placeholder: activeChannelId ? 'Send a message...' : '',
              editorRef,
              onUpdate: ({ editor }) => setCharCount(editor.getText().length),
              bubbleMenuAnchor: composerScrollRef,
            }}
          />
        </div>
        <div className='ComposerToolbar'>
          <ButtonSvgPanel engine={shortcutsEngine} />
          <button
            className='SendButton'
            onClick={onSend}
            disabled={isSendDisabled}
          >
            Send
          </button>
        </div>
      </div>
      <div className={characterCountClass.value}>
        {charCount} / {ChatMessage.MAX_CHARS}
      </div>
    </div>
  )
}
