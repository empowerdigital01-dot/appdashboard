import { existsSync } from 'fs'
import { resolve } from 'path'

const ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

function mask(value: string | undefined): string {
  if (!value || value.trim() === '') return '(ausente ou vazia)'
  if (value.length <= 6) return value
  return `${value.slice(0, 6)}...`
}

function main() {
  const root = resolve(__dirname, '..')
  const envPath = resolve(root, '.env.local')
  const envExists = existsSync(envPath)

  console.log('')
  console.log('  [Axium Dashboard] Diagnóstico de variáveis de ambiente')
  console.log('  ─────────────────────────────────────────────────────')
  console.log('')

  if (envExists) {
    console.log('  ✓ Arquivo .env.local encontrado')
  } else {
    console.log('  ✗ Arquivo .env.local NÃO encontrado')
    console.log(`    Procurado em: ${envPath}`)
  }
  console.log('')

  let allOk = true

  for (const name of ENV_VARS) {
    const value = process.env[name]
    if (value && value.trim() !== '') {
      console.log(`  ✓ ${name}`)
      console.log(`    valor: ${mask(value)}`)
    } else {
      console.log(`  ✗ ${name} — NÃO ENCONTRADA`)
      allOk = false
    }
    console.log('')
  }

  console.log('  ─────────────────────────────────────────────────────')

  if (allOk && envExists) {
    console.log('  Resultado: TUDO OK ✓')
  } else {
    console.log('  Resultado: PROBLEMAS ENCONTRADOS ✗')
    console.log('')
    if (!envExists) {
      console.log('  → Crie o arquivo .env.local na raiz do projeto')
      console.log('    cp .env.example .env.local')
    }
    console.log('  → Preencha as variáveis ausentes com os valores do Supabase')
    console.log('    (Project Settings → API)')
    console.log('  → Depois de editar, REINICIE o servidor:')
    console.log('    Ctrl+C e rode: npm run dev')
  }

  console.log('')
}

main()
