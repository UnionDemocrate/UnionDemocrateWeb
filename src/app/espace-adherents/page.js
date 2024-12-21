'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './EspaceAdherents.module.css'
import Auth from '../auth/page'

export default function EspaceAdherents() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [changingSubscription, setChangingSubscription] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedNom, setEditedNom] = useState('')
  const [editedPrenom, setEditedPrenom] = useState('')
  const router = useRouter()

  const fetchSubscription = async (userId) => {
    if (!userId) {
      console.error('UserId is null, cannot fetch subscription');
      return;
    }
    try {
      const response = await fetch(`/api/get-subscription?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error('Erreur lors de la récupération de l\'abonnement');
      }
    } catch (subscriptionError) {
      console.error('Erreur lors de la récupération de l\'abonnement:', subscriptionError);
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          if (userError.message === "Auth session missing!") {
            console.log('Utilisateur non connecté');
            setLoading(false);
            return;
          }
          console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
          throw userError;
        }

        if (user) {
          console.log('Utilisateur récupéré:', user.id);
          setUser(user);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            if (error.code === 'PGRST116') {
              console.log('Profil non trouvé, création d\'un nouveau profil');
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  is_adherent: false,
                  nom: user.user_metadata?.nom || '',
                  prenom: user.user_metadata?.prenom || ''
                })
                .select()
                .single();

              if (insertError) {
                console.error('Erreur lors de la création du profil:', insertError);
                throw insertError;
              }
              console.log('Nouveau profil créé:', newProfile);
              setProfile(newProfile);
            } else {
              throw error;
            }
          } else {
            console.log('Profil récupéré:', data);
            setProfile(data);
          }

          await fetchSubscription(user.id);
        }
      } catch (err) {
        console.error('Erreur dans fetchUserAndProfile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/get-stripe-products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      setSubscription(null)
    } catch (err) {
      console.error('Error logging out:', err)
      setError(err.message)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) {
      console.error('User is null, cannot cancel subscription');
      return;
    }
    try {
      setLoading(true)
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la résiliation de l\'abonnement')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_adherent: false })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setSubscription(null)
      alert('Votre abonnement a été résilié avec succès.')
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeSubscription = async (newPriceId) => {
    if (!user) {
      console.error('User is null, cannot change subscription');
      return;
    }
    try {
      setChangingSubscription(true);
      const response = await fetch('/api/change-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, newPriceId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement d\'abonnement');
      }

      const result = await response.json();
      setSubscription(result.subscription);

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({ is_adherent: true })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Erreur lors de la mise à jour du profil:', profileError);
      } else {
        setProfile(updatedProfile);
      }

      alert('Votre abonnement a été mis à jour avec succès.');
    } catch (err) {
      console.error('Error changing subscription:', err);
      setError(err.message);
    } finally {
      setChangingSubscription(false);
    }
  }

  const handleEdit = () => {
    setEditMode(true)
    setEditedNom(profile.nom || '')
    setEditedPrenom(profile.prenom || '')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .update({ nom: editedNom, prenom: editedPrenom })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setEditMode(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditedNom(profile.nom || '')
    setEditedPrenom(profile.prenom || '')
  }

  if (loading) {
    return <div className={`${styles.container} fade-in`}>Chargement...</div>
  }

  if (error) {
    return (
      <div className={`${styles.container} fade-in`}>
        <h1>Une erreur est survenue</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`${styles.container} fade-in`}>
        <Auth />
      </div>
    )
  }

  return (
    <div className={`${styles.container} fade-in`}>
      <h1>Bienvenue dans votre espace adhérent</h1>
      <div className={`${styles.profileInfo} card`}>
        <h2>Vos informations personnelles</h2>
        {editMode ? (
          <>
            <div>
              <label htmlFor="nom">Nom:</label>
              <input
                id="nom"
                type="text"
                value={editedNom}
                onChange={(e) => setEditedNom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="prenom">Prénom:</label>
              <input
                id="prenom"
                type="text"
                value={editedPrenom}
                onChange={(e) => setEditedPrenom(e.target.value)}
              />
            </div>
            <button onClick={handleSave} disabled={loading}>Enregistrer</button>
            <button onClick={handleCancel}>Annuler</button>
          </>
        ) : (
          <>
            <p><strong>Nom :</strong> {profile?.nom || 'Non renseigné'}</p>
            <p><strong>Prénom :</strong> {profile?.prenom || 'Non renseigné'}</p>
            <p><strong>Email :</strong> {user.email}</p>
            <p><strong>Statut d'adhésion :</strong> {profile?.is_adherent ? 'Actif' : 'Inactif'}</p>
            <button onClick={handleEdit}>Modifier</button>
          </>
        )}
      </div>
      {subscription ? (
        <div className={`${styles.subscriptionInfo} card`}>
          <h2>Détails de votre abonnement</h2>
          <p><strong>Nom du produit :</strong> {subscription.productName}</p>
          <p><strong>Montant :</strong> {subscription.amount} {subscription.currency.toUpperCase()} / {subscription.interval}</p>
          <p><strong>Statut :</strong> {subscription.status}</p>
          <p><strong>Fin de la période actuelle :</strong> {subscription.currentPeriodEnd}</p>
          <h3>Changer d'abonnement</h3>
          <div className={styles.productList}>
            {products.map((product) => (
              product.priceId !== subscription.priceId && (
                <div key={product.id} className={styles.productCard}>
                  <h4>{product.name}</h4>
                  <p>{product.description}</p>
                  <p>{product.price} {product.currency?.toUpperCase()} / {product.interval}</p>
                  <button
                    onClick={() => handleChangeSubscription(product.priceId)}
                    disabled={changingSubscription}
                    className={`btn ${styles.changeSubscriptionButton}`}
                  >
                    {changingSubscription ? 'Changement en cours...' : 'Changer pour cet abonnement'}
                  </button>
                </div>
              )
            ))}
          </div>
          <button onClick={handleCancelSubscription} className={`btn ${styles.cancelButton}`} disabled={loading}>
            Résilier mon abonnement
          </button>
        </div>
      ) : (
        <div className={`${styles.noSubscription} card`}>
          <h2>Aucun abonnement actif</h2>
          <p>Vous n'avez pas d'abonnement actif pour le moment.</p>
          <Link href="/adhesion" className={`btn ${styles.subscribeButton}`}>
            S'abonner
          </Link>
        </div>
      )}
      <div className={styles.buttonContainer}>
        <button onClick={handleLogout} className={`btn ${styles.logoutButton}`}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

