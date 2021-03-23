/**
 * Returns a function that resolves the current feedback level by a given
 * count/limit (= percent) value, where count is the number of correct
 * scores and limit is the number of max correct scores.
 *
 * Thew levels contain thresholds and the percent value is estimated to compare,
 * which threshold is exceeded and which not. By doing so we can derive the
 * correct level of feedback.
 *
 * @param feedbackDoc
 * @return {function({limit: number, count: number}): number}
 */
export const feedbackLevelFactory = feedbackDoc => {
  const thresholds = feedbackDoc.levels.map(level => level.threshold)

  return ({ limit, count }) => {
    const percent = 100 * count / limit
    let index = 0
    let highest = -1

    for (let i = 0; i < thresholds.length; i++) {
      const current = thresholds[i]
      if (percent >= current && current > highest) {
        index = i
        highest = current
      }
    }

    return index
  }
}
