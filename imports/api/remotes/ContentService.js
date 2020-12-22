import { DDP } from 'meteor/ddp-client'

export const ContentService = {}

let connection = null

ContentService.connect = async function (url) {
  if (connection) {
    connection.disconnect()
  }

  connection = DDP.connect(url)
}

ContentService.subscribe = function () {

}
