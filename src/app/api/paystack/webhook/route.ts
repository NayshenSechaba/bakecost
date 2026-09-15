import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'charge.success': {
        const { metadata, customer, amount } = event.data;
        const customerEmail = customer?.email?.toLowerCase();
        let plan: 'monthly' | 'annual' = metadata?.plan;

        // Auto-detect plan from amount or metadata if not explicitly provided
        if (!plan) {
          if (amount >= 50000) {
            plan = 'annual'; // R910.00 (91000 cents)
          } else {
            plan = 'monthly'; // R91.00 (9100 cents)
          }
        }

        let userId = metadata?.user_id;
        let bakeryId = metadata?.bakery_id;

        // If no user_id in metadata, look up user by customer email
        if (!userId && customerEmail) {
          try {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const matchedUser = usersData?.users?.find(
              (u) => u.email?.toLowerCase() === customerEmail
            );
            if (matchedUser) {
              userId = matchedUser.id;
            }
          } catch (e) {
            console.error('Error finding user by email in webhook:', e);
          }
        }

        // If we have userId but not bakeryId, resolve from profiles table
        if (userId && !bakeryId) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('bakery_id')
            .eq('id', userId)
            .single();

          if (profile) {
            bakeryId = profile.bakery_id;
          }
        }

        // If we still don't have bakeryId, exit
        if (!bakeryId) {
          console.warn('[Paystack Webhook] Could not match payment to a bakery:', { customerEmail, amount, plan });
          break;
        }

        // Calculate subscription period end date
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Activate / update subscription in Supabase
        const { error: upsertErr } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            bakery_id: bakeryId,
            plan,
            status: 'active',
            paystack_customer_id: customer?.customer_code || null,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: 'bakery_id' });

        if (upsertErr) {
          console.error('[Paystack Webhook] Error updating subscription:', upsertErr);
        } else {
          console.log(`[Paystack Webhook] Successfully activated ${plan} plan for bakery ${bakeryId}`);
        }

        break;
      }

      case 'subscription.disable': {
        const { metadata, customer } = event.data;
        const customerEmail = customer?.email?.toLowerCase();
        let userId = metadata?.user_id;

        if (!userId && customerEmail) {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail
          );
          if (matchedUser) userId = matchedUser.id;
        }

        if (!userId) break;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('bakery_id')
          .eq('id', userId)
          .single();

        if (!profile) break;

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled', plan: 'free' })
          .eq('bakery_id', profile.bakery_id);

        break;
      }

      case 'invoice.payment_failed': {
        const { metadata, customer } = event.data;
        const customerEmail = customer?.email?.toLowerCase();
        let userId = metadata?.user_id;

        if (!userId && customerEmail) {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail
          );
          if (matchedUser) userId = matchedUser.id;
        }

        if (!userId) break;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('bakery_id')
          .eq('id', userId)
          .single();

        if (!profile) break;

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('bakery_id', profile.bakery_id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
