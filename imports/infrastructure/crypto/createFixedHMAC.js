import crypto from 'crypto'

export const createFixedHMAC = (secret, encoding) => {
  const hmac = crypto.createHmac('sha256', secret)
  let digest
  return message => {
    hmac.update(message)
    if (!digest) {
      digest = hmac.digest(encoding)
    }
    return digest
  }
}
