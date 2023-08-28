export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}

export function bytesToHex(bytes: Uint8Array): string {
  return bytes.reduce(
    (hex, byte) => hex + byte.toString(16).padStart(2, '0'),
    '',
  )
}

export function refineNonNull<T>(
  input: T | null | undefined,
  errorMessage?: string,
): T {
  if (input == null) {
    throw new Error(errorMessage ?? `Unexpected ${JSON.stringify(input)}`)
  }

  return input
}

export const base64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(b64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const generateRandomBuffer = (): ArrayBuffer => {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return arr.buffer
}

export const base64UrlEncode = (challenge: ArrayBuffer): string => {
  return Buffer.from(challenge)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const truncateRegex = /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{3})$/

export const truncateEthAddress = (address?: string, separator = '•••') => {
  if (!address) return ''
  const match = address.match(truncateRegex)
  if (!match) return address
  return `${match[1]}${separator}${match[2]}`
}
