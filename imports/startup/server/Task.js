import { Task } from '../../api/session/Task'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

createCollection(Task)

const methods = Object.values(Task.methods)
createMethods(methods)
rateLimitMethods(methods)
