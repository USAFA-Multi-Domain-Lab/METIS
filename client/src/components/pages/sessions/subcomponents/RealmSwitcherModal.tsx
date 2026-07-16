import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import { useGlobalContext } from '@client/context/global'
import type { SessionRealmBasic } from '@client/sessions/SessionRealmBasic'
import { useEventListener } from '@client/toolbox/hooks'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useRef, useState } from 'react'
import { useSessionPageContext } from '../context'
import './RealmSwitcherModal.scss'

/* -- COMPONENT -- */

/**
 * A spotlight-style modal for switching the realm the member is
 * subscribed to. Members with complete visibility open it from the realm
 * switcher button in the {@link SessionTopBar}. The list of realms can be
 * filtered by typing, navigated with the arrow keys, and committed with
 * the enter/return key or a click. Escape or a backdrop click closes it.
 */
export default function RealmSwitcherModal({}: TRealmSwitcherModal_P): TReactElement | null {
  /* -- STATE -- */

  const { session, state } = useSessionPageContext()
  const [opened, setOpened] = state.realmSwitcherOpened
  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { handleError, beginLoading, finishLoading } = globalContext.actions
  const [query, setQuery] = useState<string>('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0)
  const [switching, setSwitching] = useState<boolean>(false)
  // Throwaway state used to re-render when realm member counts change.
  const [, setMemberRefreshId] = useState<number>(0)
  const listElement = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  let currentRealmId = session.member.subscribedRealmId
  let filteredRealms = session.realmBasics
    .filter((realm) =>
      realm.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((first, second) => first.name.localeCompare(second.name))

  /* -- FUNCTIONS -- */

  const close = () => setOpened(false)

  const switchToRealm = async (realm: SessionRealmBasic) => {
    // Ignore selections while a switch is already in flight.
    if (switching) return
    // Selecting the current realm is a no-op; just close.
    if (realm._id === currentRealmId) return close()

    // Lock the page behind the loading overlay while switching, since a
    // successful switch remounts the whole session page.
    setSwitching(true)
    beginLoading('Switching realm...')

    try {
      await session.$switchRealm(realm._id)
      // On success the page's `realm-switched` listener re-navigates and
      // unmounts this modal; `navigateTo` finishes the loading state.
    } catch (error) {
      finishLoading()
      handleError({
        message: 'Failed to switch realm.',
        notifyMethod: 'bubble',
      })
      setSwitching(false)
    }
  }

  /* -- EFFECTS -- */

  // Reset transient state every time the modal opens.
  useEffect(() => {
    if (opened) {
      setQuery('')
      setHighlightedIndex(0)
      setSwitching(false)
    }
  }, [opened])

  // Keep the highlighted realm scrolled into view.
  useEffect(() => {
    if (!opened) return
    let highlighted = listElement.current?.querySelector('.Highlighted')
    highlighted?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, opened])

  // Handle keyboard navigation. Arrow keys only move the highlight — never
  // commit — since switching is expensive; Enter is the explicit commit.
  useEventListener(document, ['keydown'], (event: KeyboardEvent) => {
    if (!opened || switching) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((index) =>
          Math.min(index + 1, filteredRealms.length - 1),
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((index) => Math.max(index - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (filteredRealms[highlightedIndex]) {
          switchToRealm(filteredRealms[highlightedIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
    }
  })

  // Re-render when the member list changes so realm counts stay accurate.
  // The session client refreshes the counts before this listener fires.
  useEventListener(server, ['session-members-updated'], () => {
    if (opened) setMemberRefreshId((id) => id + 1)
  })

  /* -- RENDER -- */

  if (!opened) return null

  let rootClasses = new ClassList('RealmSwitcherModal').set(
    'Switching',
    switching,
  )

  return (
    <div className={rootClasses.value}>
      <div className='Backing' onMouseDown={close}></div>
      <div className='SearchPanel'>
        <input
          className='SearchField'
          autoFocus
          value={query}
          placeholder='Search realms...'
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlightedIndex(0)
          }}
        />
        <div className='RealmList' ref={listElement}>
          {filteredRealms.length === 0 && (
            <div className='NoMatches'>No realms found.</div>
          )}
          {filteredRealms.map((realm, index) => {
            let rowClasses = new ClassList('RealmRow')
              .set('Highlighted', index === highlightedIndex)
              .set('Current', realm._id === currentRealmId)

            return (
              <div
                key={realm._id}
                className={rowClasses.value}
                onClick={() => switchToRealm(realm)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className='RealmName'>{realm.name}</div>
                <PropertyBadge
                  icon='user'
                  value={realm.memberCount}
                  description={`${realm.memberCount} ${
                    realm.memberCount === 1 ? 'member' : 'members'
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link RealmSwitcherModal}.
 */
export type TRealmSwitcherModal_P = {}
