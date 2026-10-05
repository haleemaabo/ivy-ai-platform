import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, fullName } = await request.json()

    // 1. Initialize Supabase Admin client with private Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 2. Send official invitation email via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin-login`,
      data: {
        full_name: fullName,
        role: 'ADMIN',
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 3. Upsert into public.profiles with ADMIN role
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      email: email,
      full_name: fullName,
      role: 'ADMIN',
    })

    return NextResponse.json({ success: true, user: data.user })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}