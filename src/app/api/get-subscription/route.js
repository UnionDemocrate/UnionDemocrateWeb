import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET(req) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  try {
    console.log('Récupération du profil pour userId:', userId);
    // Récupérer le stripe_customer_id de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Erreur lors de la récupération du profil utilisateur:', profileError);
      return NextResponse.json({ error: 'Erreur lors de la récupération du profil utilisateur' }, { status: 500 });
    }

    if (!profile || !profile.stripe_customer_id) {
      console.log('Aucun abonnement trouvé pour userId:', userId);
      return NextResponse.json({ subscription: null });
    }

    console.log('stripe_customer_id récupéré:', profile.stripe_customer_id);

    // Récupérer les abonnements actifs de l'utilisateur
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      expand: ['data.plan.product'],
    });

    if (subscriptions.data.length === 0) {
      console.log('Aucun abonnement actif trouvé pour stripe_customer_id:', profile.stripe_customer_id);
      return NextResponse.json({ subscription: null });
    }

    // On prend le premier abonnement actif (généralement, il n'y en a qu'un)
    const subscription = subscriptions.data[0];

    const subscriptionInfo = {
      id: subscription.id,
      status: subscription.status,
      productName: subscription.plan.product.name,
      amount: subscription.plan.amount / 100, // Conversion en euros
      currency: subscription.plan.currency,
      interval: subscription.plan.interval,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
      priceId: subscription.plan.id,
    };

    console.log('Informations d\'abonnement récupérées:', subscriptionInfo);

    return NextResponse.json({ subscription: subscriptionInfo });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

