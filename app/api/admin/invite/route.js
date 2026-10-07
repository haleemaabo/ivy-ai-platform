import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Destructure the exact fields sent from your frontend fetch
    const { email, name, role, organization, department } = await request.json();

    // 2. Initialize Supabase Admin client with Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Determine domain (verify site URL environment variable)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    console.log('Sending invite with:', {
      email,
      redirectTo: `${baseUrl}/set-password`,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    // 3. Send invitation email via Supabase Auth (Updated with /set-password redirect)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/set-password`,
      data: {
        full_name: name,
        role: role,
        organization: organization,
        department: department || null,
      },
    });

    if (error) {
      // Log detailed Supabase error server-side for debugging
      console.error('Supabase Invite API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 4. Upsert into public.profiles with metadata passed from frontend
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      email: email,
      full_name: name,
      role: role,
      organization: organization,
      department: department || null,
    });

    if (profileError) {
      console.error('Profile Upsert Error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    console.error('Server Handler Exception:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}