import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FinanceBase } from '../types/base'
import {
  encryptAndSaveVault,
  getVaultMetadata,
  loadAndDecryptVault,
} from '../vault/storage'
import { SEED_FINANCE_BASE } from './seedBase'

export type VaultStatus = 'loading' | 'setup' | 'locked' | 'unlocked'

interface FinanceBaseContextType {
  status: VaultStatus
  base: FinanceBase | null
  error: string | null
  unlock: (passphrase: string) => Promise<boolean>
  setup: (passphrase: string, useSeedHistory?: boolean) => Promise<void>
  saveBase: (mutator: (prev: FinanceBase) => FinanceBase) => Promise<void>
  lock: () => void
  exportBackup: () => void
  importBackup: (backupJson: string) => Promise<void>
}

const FinanceBaseContext = createContext<FinanceBaseContextType | null>(null)

export function FinanceBaseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>(() =>
    getVaultMetadata().hasLocalVault ? 'locked' : 'setup'
  )
  const [base, setBase] = useState<FinanceBase | null>(null)
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unlock = async (pwd: string): Promise<boolean> => {
    try {
      setError(null)
      let loaded = await loadAndDecryptVault(pwd)

      // Seamlessly upgrade existing local vaults if statements are missing or older
      if (!loaded.statements || loaded.statements.length < SEED_FINANCE_BASE.statements.length) {
        const existingTxIds = new Set(loaded.transactions?.map((t) => t.id) ?? [])
        const missingTxs = SEED_FINANCE_BASE.transactions.filter((t) => !existingTxIds.has(t.id))
        loaded = {
          ...loaded,
          statements: SEED_FINANCE_BASE.statements,
          transactions: [...(loaded.transactions ?? []), ...missingTxs],
          accounts: SEED_FINANCE_BASE.accounts,
        }
        await encryptAndSaveVault(loaded, pwd)
      }

      setBase(loaded)
      setPassphrase(pwd)
      setStatus('unlocked')
      return true
    } catch {
      setError('Senha incorreta ou cofre corrompido.')
      return false
    }
  }

  const setup = async (pwd: string, useSeedHistory = true): Promise<void> => {
    try {
      setError(null)
      let initial: FinanceBase

      if (useSeedHistory) {
        initial = SEED_FINANCE_BASE
      } else {
        initial = {
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
          accounts: [],
          transactions: [],
          statements: [],
          categories: [],
          rules: [],
          goals: [],
          settings: { fiscalStartDay: 16 },
        }
      }

      await encryptAndSaveVault(initial, pwd)
      setBase(initial)
      setPassphrase(pwd)
      setStatus('unlocked')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na inicialização do cofre.')
    }
  }

  const saveBase = async (mutator: (prev: FinanceBase) => FinanceBase): Promise<void> => {
    if (!base || !passphrase) return
    const updated = mutator(base)
    setBase(updated)
    await encryptAndSaveVault(updated, passphrase)
  }

  const lock = () => {
    setBase(null)
    setPassphrase(null)
    setStatus('locked')
  }

  const exportBackup = () => {
    if (!base) return
    const blob = new Blob([JSON.stringify(base, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minhas-financas-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (backupJson: string) => {
    if (!passphrase) throw new Error('Cofre bloqueado.')
    const imported: FinanceBase = JSON.parse(backupJson)
    if (!imported.schemaVersion) throw new Error('Arquivo de backup inválido.')
    setBase(imported)
    await encryptAndSaveVault(imported, passphrase)
  }

  return (
    <FinanceBaseContext.Provider
      value={{
        status,
        base,
        error,
        unlock,
        setup,
        saveBase,
        lock,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </FinanceBaseContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
// eslint-disable-next-line react-refresh/only-export-components
export function useFinanceBase(): FinanceBaseContextType {
  const ctx = useContext(FinanceBaseContext)
  if (!ctx) {
    throw new Error('useFinanceBase deve ser usado dentro de FinanceBaseProvider')
  }
  return ctx
}
