import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req) {
  try {
    const { userId } = await req.json();

    // Récupérer l'ID client Stripe de l'utilisateur depuis Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error('Erreur lors de la récupération du profil utilisateur')
    }

    if (!profile.stripe_customer_id) {
      throw new Error('Aucun abonnement trouvé pour cet utilisateur')
    }

    // Récupérer les abonnements actifs de l'utilisateur
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      throw new Error('Aucun abonnement actif trouvé')
    }

    // Annuler tous les abonnements actifs
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    return NextResponse.json({ message: 'Abonnement(s) résilié(s) avec succès' });
  } catch (error) {
    console.error("Erreur lors de la résiliation de l'abonnement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

