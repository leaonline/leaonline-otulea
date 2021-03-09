/**
 * Checks, whether a session has been cancelled.
 * @param cancelledAt
 * @return {boolean}
 */
export const sessionIsCancelled = ({ cancelledAt }) => Object.prototype.toString.call(cancelledAt) === '[object Date]'
