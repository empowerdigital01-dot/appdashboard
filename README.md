# Axium Dashboard

Plataforma de dashboards de tráfego pago, multi-cliente, com upload de planilha e leitura automática de métricas.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 (tema escuro monocromático)
- Supabase (Postgres + Auth + Storage)
- SheetJS (xlsx) para parse de planilhas
- Recharts para gráficos

## Setup do zero

### 1. Criar projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie um novo projeto.
2. Após criar, vá em **Project Settings → API**.
3. Anote os valores de:
   - **Project URL** (ex: `https://XYZ.supabase.co`)
   - **anon public**
   - **service_role** (atenção: essa chave é secreta — nunca compartilhe)

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com as chaves do passo anterior:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XYZ.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Vincular projeto Supabase (uma vez)

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref SEU_PROJECT_REF
```

O `project_ref` é o subdomínio da URL do projeto (ex: `XYZ` em `https://XYZ.supabase.co`).

### 5. Criar as tabelas no banco

```bash
npm run db:setup
```

Isso executa o arquivo `supabase/schema.sql` no seu banco, criando as tabelas `accounts`, `uploads` e `metrics` (com coluna `data JSONB`), além de habilitar RLS.

**Se você já tem a tabela `metrics` com colunas fixas**, execute o script em `supabase/migrations/fix_metrics_columns.sql` no SQL Editor do Supabase antes de usar o upload.

### 6. Criar o primeiro administrador

```bash
npm run create-admin -- admin@axium.com MinhaSenha123
```

Substitua `admin@axium.com` e `MinhaSenha123` pelo e-mail e senha desejados. O usuário é criado com `email_confirm: true`, então pode logar imediatamente.

### 7. Iniciar o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000/admin/login](http://localhost:3000/admin/login) e faça login.

## Uso

### Admin

- **`/admin/login`** — Login do administrador
- **`/admin`** — Lista de contas (clientes) com links copiáveis
- **`/admin/novo`** — Cadastrar novo cliente (gera slug + access_token)
- **`/admin/:id`** — Detalhes da conta e regeneração de token
- **`/admin/:id/upload`** — Upload de planilha .xlsx com métricas

### Dashboard público

- **`/d/:slug/:token`** — Dashboard do cliente validado por slug + token

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Verifica lint |
| `npm run db:setup` | Aplica schema SQL no banco (via Supabase CLI) |
| `npm run create-admin -- email senha` | Cria usuário administrador |
| `npm run check-env` | Verifica se as variáveis de ambiente estão configuradas |
| `npm run scan-secrets` | Verifica se há chaves/tokens expostos no código |

## Planilha

O dashboard é **100% dinâmico**: envie qualquer planilha com os cabeçalhos que desejar. O sistema detecta automaticamente:

- **Colunas numéricas** → cards de resumo (soma)
- **Colunas categóricas** (≤ 15 valores únicos) → gráficos de distribuição
- **Colunas de texto** com muitos valores → ranking (top N)
- **Colunas de data** → gráfico de evolução entre períodos

Não há mapeamento fixo de colunas — o conteúdo da planilha define os blocos exibidos.

## Troubleshooting

### Variáveis de ambiente não são lidas após editar o .env.local

Variáveis com prefixo `NEXT_PUBLIC_*` são embutidas no bundle durante a inicialização do Next.js. Se você editar o `.env.local` e o servidor já estiver rodando, as alterações **não terão efeito**.

**Solução:** Pare o servidor com `Ctrl+C` e inicie novamente:

```bash
npm run dev
```

### Erro persistente mesmo após reiniciar

Se o erro persistir after reiniciar o servidor:

1. Apague a pasta `.next` (cache do build do Next.js)
2. Reinicie o servidor

```bash
rm -rf .next
npm run dev
```

### Verificar se as variáveis estão sendo lidas

Antes de reportar um bug, rode o diagnóstico:

```bash
npm run check-env
```

Isso imprime no terminal se cada variável obrigatória foi encontrada (sem expor os valores completos). Se algum item aparecer como `✗ NÃO ENCONTRADA`, verifique o conteúdo do `.env.local`.

## Segurança

### Nunca commitar `.env.local`

O arquivo `.env.local` contém chaves secretas do Supabase e **nunca** deve ser versionado. Ele já está no `.gitignore`. Se precisar compartilhar as variáveis com outro desenvolvedor, envie por canal seguro (nunca por e-mail ou chat aberto).

### Nunca colar chaves em issues, PRs, chats ou documentação

Chaves do Supabase (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) são credenciais de acesso ao banco de dados. Não as exponha em:

- Issues ou pull requests no GitHub
- Mensagens de chat ou e-mails
- Documentação ou READMEs
- Prints de tela

Use placeholders como `eyJhbGciOi...` quando precisar mostrar o formato.

### Se uma chave for exposta, regenere imediatamente

Se você acidentalmente commitou ou compartilhou uma chave:

1. Vá em **Supabase → Project Settings → API Keys**
2. Clique em **Regenerate** na chave comprometida
3. Atualize o `.env.local` com a nova chave
4. Reinicie o servidor (`npm run dev`)
5. Use `git filter-branch` ou o Supabase Dashboard para revogar o acesso antigo se necessário

### Proteção automática (pre-commit hook)

Um hook de pre-commit (Husky) roda automaticamente antes de cada commit e bloqueia se encontrar:

- JWTs do Supabase (padrão `eyJ...eyJ...`)
- `SUPABASE_SERVICE_ROLE_KEY=` ou `SUPABASE_SECRET_KEY=` com valor em qualquer arquivo que não seja `.env.example`

### Verificação manual

Antes de um push manual (especialmente com `--no-verify`), rode:

```bash
npm run scan-secrets
```

Isso varre todos os arquivos do projeto procurando padrões de chaves e URLs expostas.
