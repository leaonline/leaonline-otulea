import { Unit } from 'meteor/leaonline:corelib/contexts/Unit'

Unit.isLocalCollection = true

/**
 * Extracts a content element from a unit by its contentId
 * @param unit {object}
 * @param page {number?}
 * @param contentId {string}
 * @return {object|null}
 */
Unit.getContentElement = ({ unit, page, contentId }) => {
  if (!unit || !contentId || !unit.pages?.length) {
    return null
  }

  const byId = element => element.contentId === contentId
  const p = unit.pages[page]
  if (p?.content?.length) {
    const contentElement = p.content.find(byId)
    if (contentElement) {
      return contentElement
    }
  }

  for (const page of unit.pages) {
    if (!page.content?.length) {
      continue
    }
    const contentElement = page.content.find(byId)
    if (contentElement) {
      return contentElement
    }
  }

  return null
}

export { Unit }
