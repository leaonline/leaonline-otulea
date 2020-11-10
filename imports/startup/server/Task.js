import { Task } from '../../api/session/Task'
import { createCollection } from '../../factories/collection/createCollection'
import { createMethods } from '../../factories/method/createMethods'
import { rateLimitMethods } from '../../factories/ratelimit/rateLimit'

const TaskCollection = createCollection(Task)
Task.collection = () => TaskCollection

const methods = Object.values(Task.methods)
createMethods(methods)
rateLimitMethods(methods)
