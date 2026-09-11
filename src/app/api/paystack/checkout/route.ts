import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const amount = plan === 'monthly' ? 9100 : 91000; // Amount in kobo/cents (R91 or R910)

    // Initialize Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: 'ZAR',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bakecost-lemon.vercel.app'}/settings`,
        metadata: {
          bakery_id: user.id, // We'll resolve via profile in webhook
          plan,
          user_id: user.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }

    return NextResponse.json({
      checkout_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
