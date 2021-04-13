import { onClientExec, onServerExec } from '../imports/utils/archUtils'

  import './infrastructure'
onServerExec(function () {
  import './api'
})

onClientExec(function () {
  import './client'
})

