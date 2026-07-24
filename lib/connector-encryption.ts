import crypto from 'crypto'

/**
 * Application-layer encryption for connector_credentials.encrypted_credentials.
 * Requires CONNECTOR_ENCRYPTION_KEY env var: a 32-byte key, base64-encoded
 * (generate with `openssl rand -base64 32`). Without it, encrypt/decrypt
 * throw rather than silently storing plaintext -- credentials should never
 * fall back to unencrypted storage.
 */

function getKey(): Buffer {
  const keyB64 = process.env.CONNECTOR_ENCRYPTION_KEY
  if (!keyB64) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY is not set -- cannot encrypt/decrypt connector credentials. Generate one with `openssl rand -base64 32`.')
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256). Generate with `openssl rand -base64 32`.')
  }
  return key
}

export interface EncryptedPayload {
  iv: string
  authTag: string
  ciphertext: string
  // Index signature so this satisfies Record<string, unknown> when stored
  // into connector_credentials.encrypted_credentials (typed as jsonb /
  // Record<string, unknown> in types/index.ts) -- structurally this was
  // always compatible (all values are strings, a subtype of unknown), TS
  // just needs the explicit signature to accept the assignment.
  [key: string]: string
}

export function encryptCredentials(data: Record<string, unknown>): EncryptedPayload {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

export function decryptCredentials(payload: EncryptedPayload): Record<string, unknown> {
  const key = getKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ])
  return JSON.parse(plaintext.toString('utf8'))
}

/** Mask credential values for display -- returns field keys with values replaced by a fixed-length mask, never the real value. */
export function maskCredentials(data: Record<string, unknown>): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const key of Object.keys(data)) {
    masked[key] = '••••••••'
  }
  return masked
}
