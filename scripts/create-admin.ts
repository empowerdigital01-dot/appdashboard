import { createClient } from '@supabase/supabase-js'

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('')
    console.error('  [Axium Dashboard] Uso: npm run create-admin -- <email> <senha>')
    console.error('')
    console.error('  Exemplo:')
    console.error('    npm run create-admin -- admin@axium.com MinhaSenha123')
    console.error('')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('  Erro: a senha deve ter no mínimo 6 caracteres.')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('')
    console.error('  [Axium Dashboard] Variável NEXT_PUBLIC_SUPABASE_URL não encontrada.')
    console.error('  Verifique se o arquivo .env.local existe na raiz do projeto.')
    console.error('')
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('')
    console.error('  [Axium Dashboard] Variável SUPABASE_SERVICE_ROLE_KEY não encontrada.')
    console.error('  Verifique se o arquivo .env.local existe na raiz do projeto.')
    console.error('')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`  Criando usuário admin: ${email}...`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      console.error(`  Erro: o e-mail "${email}" já está cadastrado.`)
    } else {
      console.error(`  Erro ao criar admin: ${error.message}`)
    }
    process.exit(1)
  }

  console.log('')
  console.log('  Admin criado com sucesso!')
  console.log(`  E-mail: ${data.user?.email}`)
  console.log(`  ID:     ${data.user?.id}`)
  console.log('')
  console.log('  Acesse /admin/login para entrar.')
  console.log('')
}

main()
