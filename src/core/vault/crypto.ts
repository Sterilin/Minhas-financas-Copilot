export interface EncryptedEnvelope {
  v: 1
  salt: string // Base64
  iv: string // Base64
  ciphertext: string // Base64
}

const PBKDF2_ITERATIONS = 600_000

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a string (e.g. JSON) with a user passphrase using AES-256-GCM.
 */
export async function encryptData(plainText: string, passphrase: string): Promise<EncryptedEnvelope> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const key = await deriveKey(passphrase, salt)
  const encodedData = enc.encode(plainText)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encodedData
  )

  return {
    v: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
  }
}

/**
 * Decrypts an EncryptedEnvelope back to a string with the user passphrase.
 * Throws an error if the passphrase is incorrect or data was tampered with.
 */
export async function decryptData(envelope: EncryptedEnvelope, passphrase: string): Promise<string> {
  if (envelope.v !== 1) {
    throw new Error('Versão de envelope de criptografia não suportada.')
  }

  const salt = base64ToBuffer(envelope.salt)
  const iv = base64ToBuffer(envelope.iv)
  const ciphertext = base64ToBuffer(envelope.ciphertext)

  const key = await deriveKey(passphrase, salt)
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  )

  const dec = new TextDecoder()
  return dec.decode(decryptedBuffer)
}
