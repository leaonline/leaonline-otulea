import { Routes } from '../api/routing/Routes'
import routeLabels from '../../resources/i18n/i18n_routes'

export const isTaskRoute = route => {
  if (!route) return false
  if (Routes.task === route) {
    return true
  }
  if (typeof route !== 'string') {
    return false
  }
  return route.indexOf(routeLabels.task) > -1
}
