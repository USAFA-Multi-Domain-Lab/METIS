import type { ClientMission } from '../ClientMission'

/**
 * Represents a transformation that can be applied to a mission,
 * changing its structure.
 */
export abstract class MissionTransformation {
  /**
   * The mission that the transformation is applied to.
   */
  protected _mission: ClientMission
  /**
   * The mission that the transformation is applied to.
   */
  public get mission(): ClientMission {
    return this._mission
  }

  /**
   * Whether the transformation is ready to be applied,
   * assuming that it has not been applied already.
   */
  protected abstract get _readyToApply(): boolean

  /**
   * Whether the transformation is ready to be applied,
   * meaning all conditions are met, and the transformation
   * has not been applied already.
   */
  public get readyToApply(): boolean {
    return this._readyToApply && !this.applied
  }

  /**
   * Whether the transformation has already been applied.
   */
  private _applied: boolean
  /**
   * Whether the transformation has already been applied.
   */
  public get applied(): boolean {
    return this._applied
  }

  /**
   * @param mission The mission that the transformation is applied to.
   */
  public constructor(mission: ClientMission) {
    this._mission = mission
    this._applied = false
  }

  protected abstract _apply(): void

  /**
   * Applies the transformation.
   * @note Check `readyToApply` before calling this method.
   */
  public apply(): void {
    // Check if the transformation is ready to be applied.
    if (!this.readyToApply) {
      throw new Error('Transformation is not ready to be applied.')
    }
    // Confirm that the transformation has not been applied yet.
    if (this._applied) {
      throw new Error('Transformation has already been applied.')
    }

    // Call protected apply method.
    this._apply()

    // Mark the transformation as applied.
    this._applied = true
  }
}
