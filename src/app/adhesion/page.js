'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import styles from './Adhesion.module.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function Adhesion() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User data:', user);
      setUser(user)
      if (user) {
        fetchProducts()
      } else {
        setLoading(false)
        router.push('/auth')
      }
    }

    checkUser()
  }, [router])

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch('/api/get-stripe-products')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Products fetched:', data);
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingSubscription = async () => {
    try {
      const response = await fetch(`/api/get-subscription?userId=${user.id}`);
      if (response.ok) {
        const subscriptionData = await response.json();
        if (subscriptionData && subscriptionData.status === 'active') {
          setError("Vous avez déjà un abonnement actif. Veuillez vous rendre dans votre espace adhérent pour le gérer.");
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'abonnement:', err);
      return false;
    }
  };

  const handleSubscribe = async (priceId) => {
    try {
      setLoading(true);
      setError(null);

      const hasExistingSubscription = await checkExistingSubscription();
      if (hasExistingSubscription) {
        setLoading(false);
        return;
      }

      console.log('PriceId:', priceId);
      console.log('UserId:', user?.id);

      if (!priceId || !user?.id) {
        throw new Error('PriceId or UserId is missing');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Subscription error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={`${styles.container} fade-in`}>Chargement...</div>
  }

  if (error) {
    return (
      <div className={`${styles.container} fade-in`}>
        <h1>Une erreur est survenue</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={`${styles.btn} ${styles.retryButton}`}>
          Réessayer
        </button>
      </div>
    )
  }

  if (!user) {
    return null // L'utilisateur sera redirigé dans useEffect
  }

  return (
    <div className={`${styles.container} fade-in`}>
      <h1>Choisissez votre abonnement</h1>
      <div className={styles.productList}>
        {products.map((product) => (
          <div key={product.id} className={`${styles.card} ${styles.productCard}`}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            {product.price !== null && (
              <p className={styles.price}>
                {product.price} {product.currency?.toUpperCase()}
                {product.interval && `/ ${product.interval}`}
              </p>
            )}
            {product.priceId && (
              <button
                className={`${styles.btn} ${styles.subscribeButton}`}
                onClick={() => handleSubscribe(product.priceId)}
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'S\'abonner'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

