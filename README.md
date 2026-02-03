# Herow Components

CLI privada para instalação de componentes React diretamente do GitHub, inspirada no shadcn/ui.

## Instalação Rápida

```bash
# Inicializar no seu projeto
npx @herow/cli init

# Adicionar um componente
npx @herow/cli add select-estado
```

## Como Funciona

A CLI detecta automaticamente o tipo do seu projeto (Next.js ou Vite) e ajusta:

- **Paths de instalação**: `components/ui` ou `src/components/ui`
- **Server Actions**: Criadas automaticamente para Next.js
- **Data fetching**: useEffect para Vite, Server Actions para Next.js
- **Dependências**: Instaladas automaticamente via seu package manager

## Comandos

### `init`

Inicializa a configuração do Herow no seu projeto.

```bash
npx @herow/cli init
npx @herow/cli init -y  # Pular prompts
```

### `add <componente>`

Adiciona um componente ao seu projeto.

```bash
npx @herow/cli add select-estado
npx @herow/cli add select-estado --with-form  # Com React Hook Form
npx @herow/cli add select-estado --no-deps    # Sem instalar deps
```

### `list`

Lista todos os componentes disponíveis.

```bash
npx @herow/cli list
```

## Componentes Disponíveis

### select-estado

Combobox para seleção de estados brasileiros com fetch dinâmico da API do IBGE.

**Uso básico:**

```tsx
import { SelectEstado } from "@/components/ui/select-estado"

export function MeuFormulario() {
  const [estado, setEstado] = useState("")

  return (
    <SelectEstado
      value={estado}
      onValueChange={setEstado}
      placeholder="Selecione um estado"
    />
  )
}
```

**Com React Hook Form:**

```tsx
import { SelectEstadoField } from "@/components/ui/select-estado-field"

// Dentro do seu FormProvider:
<SelectEstadoField
  name="estado"
  label="Estado"
  description="Selecione o estado"
/>
```

## Configuração

O arquivo `herow.config.json` é criado automaticamente:

```json
{
  "$schema": "https://herow.dev/schema.json",
  "style": "default",
  "typescript": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

## Estrutura do Projeto

```
herow-components/
├── packages/
│   ├── cli/                    # CLI executável
│   │   ├── src/
│   │   │   ├── commands/       # Comandos (init, add, list)
│   │   │   ├── registry/       # Definições dos componentes
│   │   │   └── utils/          # Utilitários (detect, download, deps)
│   │   └── package.json
│   │
│   └── registry/               # Código fonte dos componentes
│       └── select-estado/
│           ├── manifest.json
│           ├── select-estado.tsx
│           ├── select-estado-field.tsx
│           └── actions.ts
│
├── package.json
└── pnpm-workspace.yaml
```

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Build da CLI
pnpm build

# Executar CLI localmente
pnpm cli add select-estado
```

## Publicação

### Via npm (recomendado)

```bash
cd packages/cli
npm publish --access public
```

### Via GitHub (sem npm)

Configure seu repositório e atualize a URL base em `packages/cli/src/utils/download.ts`:

```ts
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/herowcode/herow-components/main";
```

Usuários podem usar diretamente:

```bash
npx github:herowcode/herow-components add select-estado
```

## Criando Novos Componentes

1. Crie a pasta em `packages/registry/MEU-COMPONENTE/`
2. Adicione o `manifest.json` com metadados
3. Adicione os arquivos do componente
4. Registre em `packages/cli/src/registry/index.ts`

Exemplo de manifest:

```json
{
  "name": "meu-componente",
  "description": "Descrição do componente",
  "dependencies": ["alguma-lib"],
  "registryDependencies": ["button", "popover"],
  "files": [
    { "name": "meu-componente.tsx", "path": "meu-componente.tsx", "type": "component" }
  ]
}
```

## Licença

MIT
