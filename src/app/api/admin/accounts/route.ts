import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAdminAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req)
  if (!auth.authenticated) return auth.error!

  const { data, error } = await getSupabaseAdmin()
    .from('accounts')
    .select('id, name, slug, access_token, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req)
  if (!auth.authenticated) return auth.error!

  const { name, slug } = await req.json()

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'Nome e slug são obrigatórios' },
      { status: 400 }
    )
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Slug deve conter apenas letras minúsculas, números e hífens' },
      { status: 400 }
    )
  }

  const { data: existing, error: existingError } = await getSupabaseAdmin()
    .from('accounts')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!existingError && existing) {
    return NextResponse.json(
      { error: 'Slug já está em uso' },
      { status: 409 }
    )
  }

  const { data, error } = await getSupabaseAdmin()
    .from('accounts')
    .insert({ name, slug })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
