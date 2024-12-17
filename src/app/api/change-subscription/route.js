import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req) {
  try {
    const { userId, newPriceId } = await req.json();

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

    // Récupérer l'abonnement actif de l'utilisateur
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error('Aucun abonnement actif trouvé')
    }

    const currentSubscription = subscriptions.data[0];

    // Mettre à jour l'abonnement avec le nouveau plan
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.id,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      }
    );

    return NextResponse.json({ message: 'Abonnement mis à jour avec succès', subscription: updatedSubscription });
  } catch (error) {
    console.error('Erreur lors du changement d\'abonnement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

