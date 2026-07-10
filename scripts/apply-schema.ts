import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

async function main() {
  const schemaPath = resolve(__dirname, '..', 'supabase', 'schema.sql')
  let sql: string
  try {
    sql = readFileSync(schemaPath, 'utf-8')
  } catch {
    console.error(`  Erro: arquivo supabase/schema.sql não encontrado em ${schemaPath}`)
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    // Try direct PostgreSQL connection
    try {
      const { Client } = await import('pg')
      const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
      })
      await client.connect()
      console.log('  Conectado ao banco PostgreSQL.')

      // Remove comment-only lines, then send the full SQL as one statement
      const cleaned = sql
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('--'))
        .join('\n')
        .trim()

      const statements = cleaned
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      let successCount = 0
      const created: string[] = []

      for (const stmt of statements) {
        try {
          await client.query(stmt)
          successCount++
          const tableMatch = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)
          if (tableMatch) created.push(tableMatch[1])
          const extMatch = stmt.match(/CREATE EXTENSION\s+(?:IF NOT EXISTS\s+)?(\w+)/i)
          if (extMatch) created.push(`extension: ${extMatch[1]}`)
        } catch (err: unknown) {
          const pgErr = err as { code?: string; message?: string }
          if (pgErr.code === '42710' || pgErr.code === '42P07') continue
          console.warn(`  Aviso: ${pgErr.message}`)
        }
      }

      await client.end()
      console.log(`  Schema aplicado! (${successCount} statements)`)
      for (const item of created) console.log(`    - ${item}`)
      return
    } catch (err) {
      console.error('  Erro na conexão direta, tentando via Supabase CLI...')
      console.error(err)
    }
  }

  // Fallback: Supabase CLI
  console.log('  Conectando via Supabase CLI...')
  try {
    // Write SQL to a temp file for the CLI
    const tmpPath = resolve(__dirname, '..', 'supabase', '.temp', 'apply.sql')
    const { writeFileSync, mkdirSync } = await import('node:fs')
    mkdirSync(resolve(__dirname, '..', 'supabase', '.temp'), { recursive: true })
    writeFileSync(tmpPath, sql, 'utf-8')

    execSync(`npx supabase db query --linked --file "${tmpPath}"`, {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    })

    console.log('  Schema aplicado com sucesso via Supabase CLI!')
  } catch {
    console.error('')
    console.error('  [Axium Dashboard] Não foi possível aplicar o schema.')
    console.error('')
    console.error('  Opção 1 — Defina DATABASE_URL no .env.local:')
    console.error('    postgresql://postgres:senha@db.XYZ.supabase.co:5432/postgres')
    console.error('')
    console.error('  Opção 2 — Use o Supabase CLI manualmente:')
    console.error('    npx supabase db query --linked --file supabase/schema.sql')
    console.error('')
    process.exit(1)
  }
}

main()
