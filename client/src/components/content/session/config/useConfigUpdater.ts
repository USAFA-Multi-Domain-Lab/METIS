import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { useRef } from 'react'

/**
 * Shared machinery for a session-config editor. Component state is
 * treated as the live editor value and always updates immediately;
 * this hook processes each change *after* the state settles, gating it
 * behind `approve` and only then committing it to the session config
 * and reporting it via `onChange`.
 * @param sessionConfig The session config the editor commits into.
 * @param approve Gate asked to approve a pending change; returning
 * `false` (or a rejecting/throwing promise) reverts the field. Note,
 * that this isn't last word in terms of reversion of state, `onChange`
 * also may revert the change if it so chooses.
 * @param onChange Reports an approved change, with the applied updates
 * and a callback that undoes them. An implementation that persists the
 * change calls that callback when persisting fails, so the editor stops
 * showing a value the source of truth never accepted.
 * @returns The config updater utilities; see {@link TConfigUpdater}.
 */
export function useConfigUpdater(
  sessionConfig: TSessionConfig,
  approve: (updates: Partial<TSessionConfig>) => boolean | Promise<boolean>,
  onChange: (updates: Partial<TSessionConfig>, revert: () => void) => void,
): TConfigUpdater {
  /**
   * Keys whose last write was a revert. A reverted field's state is
   * set back to its committed value, which re-runs its effect; listing
   * the key here lets that pass be skipped instead of re-processed.
   */
  const reverted = useRef<Array<keyof TSessionConfig>>([])

  /**
   * How many changes each field has processed. A change captures the
   * count it was given, so a revert arriving after a later change to
   * the same field can recognize that it has been superseded and leave
   * the newer value alone.
   * @note A counter is used rather than a comparison against the
   * current value, since a field returned to a value it held earlier
   * would compare as unchanged.
   */
  const changeCounts = useRef<Partial<Record<keyof TSessionConfig, number>>>({})

  /**
   * Runs a pending change past the `approve` gate, treating a thrown
   * error as a rejection so a failing approver can never commit a
   * change. Logs the error rather than swallowing it silently.
   * @param updates The pending config updates to approve.
   * @resolves Whether the change was approved.
   * @rejects Never.
   */
  const requestApproval = async (
    updates: Partial<TSessionConfig>,
  ): Promise<boolean> => {
    try {
      return await approve(updates)
    } catch (error) {
      console.error('Failed to approve config change.', error)
      return false
    }
  }

  /**
   * See {@link TConfigUpdater.processUpdate}.
   */
  const processUpdate = async <T extends keyof TSessionConfig>(
    key: T,
    value: TSessionConfig[T],
    setValue: TReactSetter<TSessionConfig[T]>,
  ): Promise<boolean> => {
    // The value to fall back to, read before the change is committed.
    let committedValue = sessionConfig[key]
    // Claim this as the field's most recent change.
    let changeCount = (changeCounts.current[key] ?? 0) + 1
    changeCounts.current[key] = changeCount

    /**
     * Puts the field and the config back to the value held before this
     * change, and records the key so the resulting state write is
     * skipped rather than processed as a new change.
     * @note This does nothing once a later change to the same field has
     * been processed. `onChange` may hold this callback across an
     * `await`, and by the time it decides to revert the user may have
     * moved on to a value that should not be discarded.
     */
    const revert = () => {
      if (changeCounts.current[key] !== changeCount) return
      sessionConfig[key] = committedValue
      if (!reverted.current.includes(key)) reverted.current.push(key)
      setValue(committedValue)
    }

    let approved = await requestApproval({ [key]: value })

    if (approved) {
      sessionConfig[key] = value
      onChange({ [key]: value }, revert)
    } else {
      revert()
    }
    return approved
  }

  /**
   * See {@link TConfigUpdater.useProcessUpdater}. A revert records its
   * key in `reverted` as it writes, so the state write it causes is
   * consumed here rather than processed as a new change.
   */
  const useProcessUpdater = <T extends keyof TSessionConfig>(
    key: T,
    value: TSessionConfig[T],
    setValue: TReactSetter<TSessionConfig[T]>,
  ) => {
    usePostInitEffect(() => {
      if (reverted.current.includes(key)) {
        reverted.current = reverted.current.filter((cursor) => cursor !== key)
      } else {
        void processUpdate(key, value, setValue)
      }
    }, [value])
  }

  return { processUpdate, useProcessUpdater }
}

/* -- types -- */

/**
 * The utilities returned by {@link useConfigUpdater} for committing
 * changes to a session config through its `approve`/`onChange` gate.
 */
export type TConfigUpdater = {
  /**
   * Puts a changed field value through approval. If approved, it is
   * committed to the session config and reported via `onChange`;
   * otherwise the field's state is reverted to the value still held in
   * the config. Intended for one-off commits, such as a text field
   * committing on blur.
   * @param key The config key that changed.
   * @param value The new live value of the field.
   * @param setValue The field's state setter, used to revert.
   * @resolves Whether the change was approved.
   * @rejects Never.
   */
  processUpdate: <T extends keyof TSessionConfig>(
    key: T,
    value: TSessionConfig[T],
    setValue: TReactSetter<TSessionConfig[T]>,
  ) => Promise<boolean>
  /**
   * Binds a field's live editor state to the session config. Once the
   * state settles — skipping the initial mount — the change is run
   * through `processUpdate`, committing it when approved and reverting
   * the field when rejected, or when `onChange` later reverts it. Call
   * once per field, at the top level of the component.
   * @param key The config key this field maps to.
   * @param value The field's current live value.
   * @param setValue The field's state setter, used to revert.
   */
  useProcessUpdater: <T extends keyof TSessionConfig>(
    key: T,
    value: TSessionConfig[T],
    setValue: TReactSetter<TSessionConfig[T]>,
  ) => void
}
