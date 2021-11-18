import { addDimensionToFeedback } from '../../patches/addDimensionToFeedback'

const { patches } = Meteor.settings
const dryRun = !!patches.dryRun

console.debug('[patches]: run patches', { dryRun })

if (patches.addDimensionToFeedback) {
  addDimensionToFeedback({ dryRun })
}
