import { describe, expect, it } from 'vitest'
import { decryptData, encryptData } from './crypto'

describe('WebCrypto Vault (crypto.ts)', () => {
  it('encrypts and decrypts string data correctly', async () => {
    const payload = JSON.stringify({ hello: 'world', balanceCents: 2471808 })
    const passphrase = 'minha-senha-secreta-forte'

    const envelope = await encryptData(payload, passphrase)
    expect(envelope.v).toBe(1)
    expect(envelope.salt).toBeTruthy()
    expect(envelope.iv).toBeTruthy()
    expect(envelope.ciphertext).toBeTruthy()

    const decrypted = await decryptData(envelope, passphrase)
    expect(decrypted).toBe(payload)
  })

  it('fails decryption with wrong passphrase', async () => {
    const payload = 'dados confidenciais'
    const envelope = await encryptData(payload, 'senha-correta')

    await expect(decryptData(envelope, 'senha-errada')).rejects.toThrow()
  })
})
