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
        const { metadata, customer } = event.data;
        const plan = metadata?.plan as 'monthly' | 'annual';
        const userId = metadata?.user_id;

        if (!userId || !plan) break;

        // Get the user's bakery_id from their profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('bakery_id')
          .eq('id', userId)
          .single();

        if (!profile) break;

        // Calculate period end
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update or insert subscription
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            bakery_id: profile.bakery_id,
            plan,
            status: 'active',
            paystack_customer_id: customer?.customer_code || null,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: 'bakery_id' });

        break;
      }

      case 'subscription.disable': {
        const { metadata } = event.data;
        const userId = metadata?.user_id;

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
        const { metadata } = event.data;
        const userId = metadata?.user_id;

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
