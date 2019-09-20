import { LeaError } from './LeaErorr'

export class RouteError extends LeaError {
  static get TITLE () {
    return 'errors.routeError.title'
  }

  static get PAGE_NOT_FOUND () {
    return 'errors.routeError.pageNotFound'
  }

  constructor (reason, details) {
    super(RouteError.TITLE, reason, details)
  }
}
