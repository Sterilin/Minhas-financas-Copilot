# Minhas Finanças — protótipo

Protótipo local para a nova versão do aplicativo de finanças, construído com React, TypeScript e Vite. A estrutura separa páginas, componentes reutilizáveis, tipos, dados de demonstração e algumas regras iniciais de domínio.

> **Demonstração somente:** todos os valores, nomes e registros exibidos são fictícios. O protótipo não se conecta a bancos, planilhas, APIs ou qualquer fonte financeira real. Não use dados reais nesta versão.

## Páginas

- **Resumo:** cartões de saldo demonstrativo, reservas em metas, média de faturas fictícias, contas, parcelas futuras e indicadores visuais.
- **Comparativo:** visão por categoria entre períodos A e B com valores de demonstração.
- **Parcelas:** compras fictícias, valores pagos/pendentes e vencimentos.
- **Metas:** cartões de progresso e contribuições ilustrativas.
- **Dados:** tabela ilustrativa de extratos e faturas, sem importação ou conciliação real.

## Requisitos

- Node.js LTS e npm.

## Executar localmente

Na pasta do projeto, execute:

```powershell
npm install
npm run dev
```

Abra o endereço local apresentado pelo Vite no terminal.

## Testes e build

```powershell
npm run test:run
npm run build
```

Opcionalmente, execute o linter:

```powershell
npm run lint
```

## Estrutura inicial

```text
src/
  components/       componentes reutilizáveis e navegação
  data/             dados fictícios de demonstração
  domain/           cálculos iniciais sem dependência da interface
  features/         páginas Resumo, Comparativo, Parcelas, Metas e Dados
  App.test.tsx      testes iniciais de renderização
  types.ts          contratos TypeScript compartilhados
```

## Escopo e limitações

Esta entrega cobre apenas a estrutura inicial, navegação, componentes básicos e testes de renderização. Não implementa autenticação, persistência, importação, reconciliação, gráficos financeiros completos nem conexão a dados reais. Os indicadores de demonstração não devem ser interpretados como aconselhamento ou resultados financeiros reais.
