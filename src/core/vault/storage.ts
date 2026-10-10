import { decryptData, encryptData, type EncryptedEnvelope } from './crypto'
import type { FinanceBase } from '../types/base'

const LOCAL_STORAGE_KEY = 'minhas_financas_vault'
const TOKEN_KEY = 'minhas_financas_gh_token'

export interface VaultMetadata {
  lastUpdated: string
  hasLocalVault: boolean
  hasGitHubToken: boolean
}

export function getVaultMetadata(): VaultMetadata {
  const localVault = localStorage.getItem(LOCAL_STORAGE_KEY)
  const ghToken = localStorage.getItem(TOKEN_KEY)

  return {
    lastUpdated: localVault ? JSON.parse(localVault).updatedAt || '' : '',
    hasLocalVault: !!localVault,
    hasGitHubToken: !!ghToken,
  }
}

export function saveGitHubToken(token: string): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getGitHubToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Loads encrypted vault from LocalStorage (or GitHub) and decrypts it with the passphrase.
 */
export async function loadAndDecryptVault(passphrase: string): Promise<FinanceBase> {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) {
    throw new Error('Nenhum cofre financeiro encontrado localmente.')
  }

  const envelope: EncryptedEnvelope = JSON.parse(raw)
  const decryptedJson = await decryptData(envelope, passphrase)
  const base: FinanceBase = JSON.parse(decryptedJson)
  return base
}

/**
 * Encrypts FinanceBase with passphrase and saves to LocalStorage, and syncs with GitHub if configured.
 */
export async function encryptAndSaveVault(
  base: FinanceBase,
  passphrase: string
): Promise<void> {
  const updatedBase: FinanceBase = {
    ...base,
    updatedAt: new Date().toISOString(),
  }

  const jsonString = JSON.stringify(updatedBase)
  const envelope = await encryptData(jsonString, passphrase)

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(envelope))

  // Optional: Sync to GitHub data branch if token is provided
  const token = getGitHubToken()
  if (token && base.settings.githubRepo) {
    await syncToGitHub(envelope, base.settings.githubRepo, base.settings.githubBranch || 'data', token)
  }
}

/**
 * Synchronizes encrypted envelope with GitHub Contents API on branch `data`.
 */
async function syncToGitHub(
  envelope: EncryptedEnvelope,
  repo: string,
  branch: string,
  token: string
): Promise<void> {
  try {
    const url = `https://api.github.com/repos/${repo}/contents/vault.enc.json?ref=${branch}`
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    let sha: string | undefined
    if (getRes.ok) {
      const data = await getRes.json()
      sha = data.sha
    }

    const contentBase64 = btoa(JSON.stringify(envelope))
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'chore: update encrypted finance vault',
        content: contentBase64,
        branch,
        sha,
      }),
    })
  } catch (err) {
    console.warn('Falha na sincronização em segundo plano com GitHub:', err)
  }
}
