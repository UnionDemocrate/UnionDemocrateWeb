import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function POST(req) {
  try {
    const { priceId, userId } = await req.json();

    if (!priceId || !userId) {
      throw new Error('Missing required parameters: priceId or userId');
    }

    // Récupérer le profil de l'utilisateur
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Le profil n'existe pas, créons-le
        const { data: user } = await supabase.auth.admin.getUserById(userId)
        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nom: user.user_metadata?.nom || '',
            prenom: user.user_metadata?.prenom || '',
            is_adherent: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erreur lors de la création du profil:', insertError);
          throw new Error('Erreur lors de la création du profil utilisateur');
        }

        profile = newProfile;
      } else {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw new Error('Erreur lors de la récupération du profil utilisateur');
      }
    }

    let customerId = profile.stripe_customer_id;

    // Si l'utilisateur n'a pas encore de customer_id Stripe, on en crée un
    if (!customerId) {
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
      if (userError) {
        throw new Error('Erreur lors de la récupération des informations utilisateur');
      }

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUserId: userId
        }
      });

      customerId = customer.id;

      // Mettre à jour le profil avec le nouveau customer_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Erreur lors de la mise à jour du profil utilisateur');
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/adhesion/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/adhesion`,
      client_reference_id: userId,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
