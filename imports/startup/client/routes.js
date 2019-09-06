import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'
import '../../ui/pages/loading/loading' // import loading route in order to prove a loading screen immediately
import manifest from '../../../public/manifest'

const defaultTarget = 'main-render-target'

Router.titlePrefix(`${manifest.short_name} - `)

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))
