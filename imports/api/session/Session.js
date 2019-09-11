import { Role } from '../accounts/Role'
import { Group } from '../accounts/Group'

export const Session = {
  name: 'session',
  label: 'session.title',
  icon: 'code-fork',
  schema: {
    startedAt: Date,
    completedAt: Date,
    dimension: String,
    level: String,
    sets: Array,
    'sets.$': String
  },
  methods: {
    start: {
      name: 'session.start',
      schema: {
        dimension: String,
        level: String
      },
      roles: [ Role.runSession.value ],
      group: Group.field.value,
      run ({ dimension, level }) {
        throw new Error('not implemented')
      },
      call ({ dimension, level }) {
        throw new Error('not implemented')
      }
    },
    complete: {
      name: 'session.complete',
      schema: {
        sessionId: String
      },
      roles: [ Role.runSession.value ],
      group: Group.field.value,
      run ({ sessionId }) {
        throw new Error('not implemented')
      },
      call ({ sessionId }) {
        throw new Error('not implemented')
      }
    },
    cancel: {
      name: 'session.cancel',
      schema: {
        sessionId: String
      },
      roles: [ Role.runSession.value ],
      group: Group.field.value,
      run ({ sessionId }) {
        throw new Error('not implemented')
      },
      call ({ sessionId }) {
        throw new Error('not implemented')
      }
    }
  },
  publications: {}
}
