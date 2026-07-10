import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, relative, join } from 'path'

const ROOT = resolve(__dirname, '..')

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
const SERVICE_KEY_PATTERN = /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)\s*=\s*\S+/
const URL_KEY_PATTERN = /(?:SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)\s*=\s*https?:\/\/\S+/

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.husky',
])
const SKIP_FILES = new Set([
  '.env.example', '.env.local',
])
const SKIP_EXTENSIONS = new Set(['md'])

function scan(dir: string): { file: string; line: number; content: string; reason: string }[] {
  const findings: { file: string; line: number; content: string; reason: string }[] = []

  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue

    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      findings.push(...scan(fullPath))
      continue
    }

    if (!stat.isFile()) continue

    // Skip binary / non-text files by extension
    const ext = entry.split('.').pop()?.toLowerCase()
    if (['ico', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'eot'].includes(ext ?? '')) continue

    // Skip documentation files
    if (SKIP_EXTENSIONS.has(ext ?? '')) continue

    // Skip .env files that hold real values
    if (SKIP_FILES.has(entry)) continue
    if (entry.endsWith('.local') && entry.startsWith('.env')) continue

    let content: string
    try {
      content = readFileSync(fullPath, 'utf-8')
    } catch {
      continue
    }

    const relPath = relative(ROOT, fullPath)
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for JWT patterns (3-part base64 dots)
      const jwtMatches = line.match(JWT_PATTERN)
      if (jwtMatches) {
        for (const jwt of jwtMatches) {
          // Filter out common false positives (e.g. placeholder strings)
          if (jwt.length < 50) continue
          findings.push({
            file: relPath,
            line: i + 1,
            content: jwt.slice(0, 30) + '...',
            reason: 'JWT Supabase detectado (3 partes eyJ...eyJ...)',
          })
        }
      }

      // Check for service role key assignment with non-empty value
      if (SERVICE_KEY_PATTERN.test(line)) {
        findings.push({
          file: relPath,
          line: i + 1,
          content: line.trim().slice(0, 60),
          reason: 'SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY com valor',
        })
      }

      // Check for Supabase URL assignment with non-empty value
      if (URL_KEY_PATTERN.test(line)) {
        // Only flag if the file is NOT .env.example or .env.local
        if (!entry.startsWith('.env')) {
          findings.push({
            file: relPath,
            line: i + 1,
            content: line.trim().slice(0, 60),
            reason: 'URL do Supabase hardcoded em arquivo que não é .env',
          })
        }
      }
    }
  }

  return findings
}

function main() {
  console.log('')
  console.log('  [Axium Dashboard] Varredura de segredos')
  console.log('  ─────────────────────────────────────────')
  console.log('')

  const findings = scan(ROOT)

  if (findings.length === 0) {
    console.log('  ✓ Nenhum segredo encontrado. Tudo limpo!')
    console.log('')
    process.exit(0)
  }

  console.log(`  ✗ ${findings.length} problema(s) encontrado(s):`)
  console.log('')

  for (const f of findings) {
    console.log(`  Arquivo: ${f.file}:${f.line}`)
    console.log(`  Motivo:  ${f.reason}`)
    console.log(`  Trecho:  ${f.content}`)
    console.log('')
  }

  console.log('  ─────────────────────────────────────────')
  console.log('')
  console.log('  Como corrigir:')
  console.log('  1. Remova a chave/valor do arquivo listado acima')
  console.log('  2. Coloque o valor no .env.local (que está no .gitignore)')
  console.log('  3. Se o segredo já foi commitado, regenere a chave em')
  console.log('     Supabase → Settings → API Keys imediatamente')
  console.log('')
  process.exit(1)
}

main()
