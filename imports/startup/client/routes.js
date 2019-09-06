import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'
import '../../ui/pages/loading/loading'
import manifest from '../../../public/manifest'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`${manifest.short_name} - `)
Router.loadingTemplate('loading')

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))
