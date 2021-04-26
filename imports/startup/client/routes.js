import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'

const defaultTarget = 'main-render-target'

Router.titlePrefix('otu.lea - ')
Router.loadingTemplate('loading')

const onError = error => {
  import { sendError } from '../../contexts/errors/api/sendError'
  sendError({ error })
}

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route, onError))
