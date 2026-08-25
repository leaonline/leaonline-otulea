import '../imports/startup/server/logging'
import '../imports/startup/server/monitoring'
import '../imports/startup/server/collection2'
import '../imports/startup/server/settings'
import '../imports/startup/server/csp'
import '../imports/startup/server/validation'
import '../imports/startup/server/backendConfig'
import '../imports/startup/server/error'
import '../imports/startup/server/accounts'

// CONTEXTS
import '../imports/startup/server/contentContexts'
import '../imports/startup/server/legal'
import '../imports/startup/server/logos'
import '../imports/startup/server/feedback'
import '../imports/startup/server/videos'
import '../imports/startup/server/Response'
import '../imports/startup/server/Session'
import '../imports/startup/server/Record'
import '../imports/startup/server/diagnostics'

// RATE LIMIT
import '../imports/startup/server/rateLimit'

// SYNC
import '../imports/startup/server/syncContent'

// apply patches at the very last stage
import '../imports/startup/server/patches'
