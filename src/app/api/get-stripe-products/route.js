import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function GET() {
  try {
    console.log('Tentative de récupération des produits Stripe');
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Défini' : 'Non défini');

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    const products = await stripe.products.list({
      expand: ['data.default_price'],
      active: true,
    });

    console.log(`${products.data.length} produits récupérés`);

    const formattedProducts = products.data.map((product) => {
      const price = product.default_price;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price ? price.unit_amount / 100 : null,
        currency: price ? price.currency : null,
        interval: price && price.recurring ? price.recurring.interval : null,
        priceId: price ? price.id : null,
      };
    });

    console.log('Produits formatés avec succès');
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

