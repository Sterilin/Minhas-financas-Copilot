import { useState } from 'react'
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { formatCents } from '../../core/domain/money'
import { applyRulesToTransactions, sortTransactionsDesc } from '../../core/domain/rules'
import type { StatementRecord, Transaction } from '../../core/types/base'
import { autoParsePdf, type ParsePdfResult } from '../../importers'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './ImportarPage.css'

interface StagedImport {
  file: File
  status: 'parsing' | 'ready' | 'error' | 'already_imported'
  result?: ParsePdfResult
  error?: string
}

export default function ImportarPage() {
  const { base, saveBase } = useFinanceBase()
  const [stagedFiles, setStagedFiles] = useState<StagedImport[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setSuccessMessage(null)

    const newStaged: StagedImport[] = Array.from(files).map((file) => ({
      file,
      status: 'parsing',
    }))

    setStagedFiles((prev) => [...prev, ...newStaged])

    // Process each file
    for (let i = 0; i < newStaged.length; i++) {
      const item = newStaged[i]
      try {
        const buffer = await item.file.arrayBuffer()
        const parsed = await autoParsePdf(buffer, item.file.name)

        if (parsed.error || !parsed.result) {
          updateStaged(item.file.name, {
            status: 'error',
            error: parsed.error || 'Erro ao processar PDF.',
            result: parsed,
          })
          continue
        }

        // Check if file hash was already imported
        const isDuplicate = base?.statements.some((s) => s.fileHash === parsed.fileHash)
        if (isDuplicate) {
          updateStaged(item.file.name, {
            status: 'already_imported',
            result: parsed,
          })
          continue
        }

        updateStaged(item.file.name, {
          status: 'ready',
          result: parsed,
        })
      } catch (err: unknown) {
        updateStaged(item.file.name, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Falha na leitura do arquivo.',
        })
      }
    }
  }

  const updateStaged = (fileName: string, update: Partial<StagedImport>) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.file.name === fileName ? { ...item, ...update } : item))
    )
  }

  const handleSaveAll = async () => {
    if (!base) return
    setIsSaving(true)

    const readyItems = stagedFiles.filter((item) => item.status === 'ready' && item.result?.result)
    const newTransactions: Transaction[] = []
    const newStatements: StatementRecord[] = []

    for (const item of readyItems) {
      if (item.result?.result) {
        newTransactions.push(...item.result.result.transactions)
        newStatements.push(item.result.result.statement)
      }
    }

    // Deduplicate transactions by ID
    const existingTxIds = new Set(base.transactions.map((t) => t.id))
    const uniqueNewTxs = newTransactions.filter((t) => !existingTxIds.has(t.id))

    await saveBase((prev) => {
      const classifiedNew = applyRulesToTransactions(uniqueNewTxs, prev.rules)
      return {
        ...prev,
        transactions: sortTransactionsDesc([...classifiedNew, ...prev.transactions]),
        statements: [...newStatements, ...prev.statements],
      }
    })

    setIsSaving(false)
    setStagedFiles([])
    setSuccessMessage(
      `Sucesso! ${uniqueNewTxs.length} novas transações e ${newStatements.length} extratos foram incorporados e criptografados na base.`
    )
  }

  const readyCount = stagedFiles.filter((s) => s.status === 'ready').length

  return (
    <PageShell
      title="Atualizar Base via PDF"
      description="Envie extratos bancários (Bradesco, Santander) ou faturas de cartão. Os PDFs são processados exclusivamente na memória do seu navegador com segurança total."
    >
      {/* Upload Dropzone */}
      <div className="upload-dropzone panel">
        <UploadCloud size={48} className="upload-icon" />
        <h3 className="upload-title">Selecione ou arraste os PDFs bancários</h3>
        <p className="upload-subtitle">
          Funciona com extratos em PDF do Bradesco, Santander Conta e faturas do Santander Cartão.
        </p>
        <label className="btn btn-primary upload-btn">
          Escolher Arquivos PDF
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
            className="file-input-hidden"
          />
        </label>
      </div>

      {successMessage && (
        <div className="success-banner">
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Staged Items List */}
      {stagedFiles.length > 0 && (
        <Panel
          title="Arquivos Processados"
          action={
            readyCount > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSaving}
                onClick={handleSaveAll}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Criptografando e Salvando...
                  </>
                ) : (
                  `Salvar na Base (${readyCount} prontos)`
                )}
              </button>
            )
          }
        >
          <div className="staged-list">
            {stagedFiles.map((item) => (
              <div key={item.file.name} className="staged-card">
                <div className="staged-header">
                  <div className="file-info">
                    <FileText size={20} className="file-icon" />
                    <div>
                      <strong className="file-name">{item.file.name}</strong>
                      <span className="file-meta">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="staged-status">
                    {item.status === 'parsing' && (
                      <span className="badge badge-accent">
                        <Loader2 size={14} className="spin" /> Analisando...
                      </span>
                    )}
                    {item.status === 'ready' && (
                      <span className="badge badge-positive">
                        <CheckCircle2 size={14} /> Pronto para importar
                      </span>
                    )}
                    {item.status === 'already_imported' && (
                      <span className="badge">
                        Arquivo já importado anteriormente
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="badge badge-negative">
                        <XCircle size={14} /> {item.error || 'Erro'}
                      </span>
                    )}
                  </div>
                </div>

                {item.result?.result && (
                  <div className="staged-summary">
                    <span>
                      Instituição: <strong>{item.result.detectedBank}</strong>
                    </span>
                    <span>
                      Período:{' '}
                      <strong>
                        {item.result.result.periodStart} a {item.result.result.periodEnd}
                      </strong>
                    </span>
                    <span>
                      Lançamentos: <strong>{item.result.result.transactions.length}</strong>
                    </span>
                    {item.result.result.closingBalanceCents !== undefined && (
                      <span>
                        Saldo Final:{' '}
                        <strong className="money">
                          {formatCents(item.result.result.closingBalanceCents)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </PageShell>
  )
}
