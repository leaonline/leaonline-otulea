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
