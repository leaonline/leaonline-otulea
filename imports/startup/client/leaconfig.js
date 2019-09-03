import leaconfig from '../../../resources/lea/leaconfig'
import { isUndefined } from '../../utils/isDefined'

Template.registerHelper('leaconfig', function (categoryKey, valueKey) {
  const category = leaconfig[categoryKey]
  if (isUndefined(category)) {
    return
  }
  return category[valueKey]
})
