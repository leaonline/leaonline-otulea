import { Routes } from '../../api/routing/Routes'
import { Router } from '../../api/routing/Router'

// import loading route in order to prove a loading screen immediately
import '../../ui/pages/loading/loading'

const defaultTarget = 'main-render-target'

Object
  .values(Routes)
  .map(route => {
    route.target = (route.target || defaultTarget)
    return route
  })
  .forEach(route => Router.register(route))
