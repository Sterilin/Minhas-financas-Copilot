import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'

export default function TemplatePage() {
  return (
    <PageShell
      title="Nova Ferramenta"
      description="Este é o modelo para criar uma nova ferramenta modular."
    >
      <Panel title="Seção Principal">
        <p>Conteúdo da ferramenta customizada.</p>
      </Panel>
    </PageShell>
  )
}
