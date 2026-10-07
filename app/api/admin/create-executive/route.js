import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with the private SERVICE ROLE KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req) {
  try {
    const { email, password, name, organization, department } = await req.json();

    // 1. Create Auth User with Admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'EXECUTIVE' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert into profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      {
        id: userId,
        full_name: name,
        email,
        role: 'EXECUTIVE',
        organization,
        department,
      },
    ]);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Insert into executive_credentials table
    const { error: credError } = await supabaseAdmin.from('executive_credentials').upsert(
      [
        {
          user_id: userId,
          email,
          assigned_password: password,
          organization,
        },
      ],
      { onConflict: 'user_id' }
    );

    if (credError) {
      return NextResponse.json({ error: credError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}