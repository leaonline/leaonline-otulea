import { Routes } from '../../ui/routing/Routes'
import { Router } from '../../ui/routing/Router'
import { lazyRequire } from '../../utils/lazyRequire'

const defaultTarget = 'main-render-target'

Router.titlePrefix('otu.lea - ')
Router.loadingTemplate('loading')

const getSendError = lazyRequire(() => {
  const { sendError } = require('../../contexts/errors/api/sendError')
  return sendError
})
const onError = (error) => {
  const sendError = getSendError()
  sendError({ error })
}

Object.values(Routes)
  .map((route) => {
    route.target = route.target || defaultTarget
    return route
  })
  .forEach((route) => Router.register(route, onError))
