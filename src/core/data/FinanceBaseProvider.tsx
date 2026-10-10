import { createContext, useContext, useState, type ReactNode } from 'react'
import { buildBaseFromLegacyTsvs } from '../../importers/legacyTsv'
import type { FinanceBase } from '../types/base'
import {
  encryptAndSaveVault,
  getVaultMetadata,
  loadAndDecryptVault,
} from '../vault/storage'
import { INITIAL_TSV_RAW } from './initialData'

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
      const loaded = await loadAndDecryptVault(pwd)
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
        initial = buildBaseFromLegacyTsvs({
          bradescoTsv: INITIAL_TSV_RAW.bradesco,
          santanderAccTsv: INITIAL_TSV_RAW.santanderAcc,
          santanderCardTsv: INITIAL_TSV_RAW.santanderCard,
          goalsTsv: INITIAL_TSV_RAW.goals,
        })
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
