import { HTTP } from 'meteor/jkuester:http'

HTTP.debug((...args) => console.debug('[HTTP]:', ...args))
