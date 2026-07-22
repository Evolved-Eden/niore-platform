import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { provisionAccount } from '@/app/api/admin/provision/route';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { email, password, fullName, role, planTier, isTestAccount, autoApprove } = body;

    // Validate
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // ── 1. Create auth user ──
    // Use admin_create_user RPC as primary (bypasses GoTrue which is broken).
    // Falls back to auth.admin.createUser() if RPC not available.
    let userId: string;

    try {
      const { data: rpcUserId, error: rpcError } = await supabase.rpc('admin_create_user', {
        p_email: email,
        p_password: password,
        p_full_name: fullName || null,
        p_role: role || 'client',
      } as never) as any;

      if (rpcError) {
        // RPC not available or failed — try GoTrue admin API as fallback
        throw rpcError;
      }

      userId = rpcUserId;
    } catch (rpcErrorOrException: any) {
      console.warn('RPC method failed, trying GoTrue admin API:', rpcErrorOrException.message);
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || null,
            role: role || 'client',
          },
        });

        if (authError) {
          throw authError;
        }

        userId = authUser.user.id;

        // Ensure public.users record exists (in case trigger is missing)
        const { error: userError } = await supabase.from('users').upsert({
          id: userId,
          email,
          full_name: fullName || null,
          role: role || 'client',
          metadata: {
            created_by: 'admin',
            is_test_account: isTestAccount || false,
          },
        } as never, { onConflict: 'id' });

        if (userError) {
          console.warn('Users table upsert warning:', userError.message);
        }
      } catch (authError: any) {
        return NextResponse.json({
          error: 'Failed to create user. Run migration 00005 in Supabase SQL Editor first.',
          detail: 'RPC error: ' + (rpcErrorOrException.message || JSON.stringify(rpcErrorOrException)) + '. Auth error: ' + (authError.message || ''),
        }, { status: 500 });
      }
    }

    // 3. If client/creator role, create client record + optionally provision
    const needsClientRecord = role === 'client' || role === 'creator' || isTestAccount;

    if (needsClientRecord) {
      const effectiveTier = planTier || (isTestAccount ? 'client_test' : null);
      const clientStatus = autoApprove ? 'admin_approved' : 'pending_approval';

      try {
        const { error: clientErr } = await supabaseAdmin
          .from('clients')
          .upsert({
            id: userId,
            email,
            full_name: fullName || null,
            status: clientStatus,
            plan_tier_key: effectiveTier,
            onboarding_status: autoApprove ? 'approved' : 'pending',
            metadata: { is_test_account: isTestAccount || false, created_by: 'admin', created_at: new Date().toISOString() },
          }, { onConflict: 'id' });

        if (clientErr) console.error('Client record creation failed (non-fatal):', clientErr.message);
      } catch (clientErr: any) {
        console.error('Client record creation failed (non-fatal):', clientErr.message);
      }

      // 4. Auto-provision if approved (test accounts or explicit auto-approve)
      if (autoApprove && effectiveTier) {
        try {
          await provisionAccount({
            userId,
            email,
            fullName: fullName || null,
            planTierKey: effectiveTier,
            role: role || 'client',
          });
        } catch (provError: any) {
          console.error('Provisioning failed (non-fatal):', provError.message);
          return NextResponse.json({
            success: true,
            warning: 'User created but provisioning failed: ' + provError.message,
            userId,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: isTestAccount
        ? `Test account ${email} created and provisioned`
        : `User ${email} created${autoApprove ? ' and approved' : ' (pending approval)'}`,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
