import express, { Router } from 'express'
import MetisServer from '../index'

/**
 * A router for a Metis server.
 */
export default class MetisRouter {
  /**
   * The Express router.
   */
  private _expressRouter: Router
  /**
   * The path for the router to control.
   */
  private _path: string
  /**
   * The map of routes for the router.
   */
  private _map: TMetisRouterMap

  /**
   * The Express router.
   */
  public get expressRouter(): Router {
    return this._expressRouter
  }
  /**
   * The path for the router to control.
   */
  public get path(): string {
    return this._path
  }

  /**
   * The map of routes for the router.
   */
  public get map(): TMetisRouterMap {
    return this._map
  }

  /**
   * @param path The path for the router to control.
   * @param map The map of routes for the router.
   */
  public constructor(path: string, map: TMetisRouterMap) {
    this._expressRouter = express.Router()
    this._path = path
    this._map = map
  }
}

export type TMetisRouterMap = (
  router: Router,
  server: MetisServer,
  done: () => void,
) => void
