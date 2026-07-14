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
 * `false` (or a rejecting/throwing promise) reverts the field.
 * @param onChange Reports an approved change, with the applied updates.
 * @returns The config updater utilities; see {@link TConfigUpdater}.
 */
export function useConfigUpdater(
  sessionConfig: TSessionConfig,
  approve: (updates: Partial<TSessionConfig>) => boolean | Promise<boolean>,
  onChange: (updates: Partial<TSessionConfig>) => void,
): TConfigUpdater {
  /**
   * Keys whose last write was a revert. A reverted field's state is
   * set back to its committed value, which re-runs its effect; listing
   * the key here lets that pass be skipped instead of re-processed.
   */
  const reverted = useRef<Array<keyof TSessionConfig>>([])

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
   * See {@link TConfigUpdater.processUpdate}. Note this deliberately
   * does not touch `reverted`; tracking reverts is left to
   * {@link useProcessUpdater}.
   */
  const processUpdate = async <T extends keyof TSessionConfig>(
    key: T,
    value: TSessionConfig[T],
    setValue: TReactSetter<TSessionConfig[T]>,
  ): Promise<boolean> => {
    let approved = await requestApproval({ [key]: value })

    if (approved) {
      sessionConfig[key] = value
      onChange({ [key]: value })
    } else {
      setValue(sessionConfig[key])
    }
    return approved
  }

  /**
   * See {@link TConfigUpdater.useProcessUpdater}. On rejection the key is
   * recorded in `reverted` so the resulting revert-write is skipped on
   * the effect's next run rather than processed as a new change.
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
        processUpdate(key, value, setValue).then((approved) => {
          // `processUpdate` sets the state to revert the value
          // but doesn't add the key to the reverted list. Adding
          // it here adds the key before the update actually occurs.
          if (!approved) reverted.current.push(key)
        })
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
   * the field when rejected. Call once per field, at the top level of
   * the component.
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
