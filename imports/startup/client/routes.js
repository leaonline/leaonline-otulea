import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`otu.lea - `)
Router.loadingTemplate('loading')

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))
