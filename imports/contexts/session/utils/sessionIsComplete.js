/**
 *
 * @param completedAt
 * @return {boolean}
 */
export const sessionIsComplete = ({ completedAt }) => Object.prototype.toString.call(completedAt) === '[object Date]'