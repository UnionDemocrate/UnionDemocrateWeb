'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './Auth.module.css'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createProfile = async (userId, userData) => {
    console.log('Tentative de création/mise à jour du profil pour userId:', userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          is_adherent: false
        })

      if (error) {
        console.error('Erreur Supabase lors de la création/mise à jour du profil:', error)
        throw error
      }

      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()

      if (selectError) {
        console.error('Erreur lors de la récupération du profil après upsert:', selectError)
        throw selectError
      }

      console.log('Profil créé/mis à jour avec succès:', profile)
      return profile
    } catch (error) {
      console.error('Erreur détaillée lors de la création/mise à jour du profil:', error)
      throw error
    }
  }

  const checkSubscription = async (userId) => {
    try {
      const response = await fetch(`/api/get-subscription?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Données d\'abonnement:', data)
        return data.subscription !== null && data.subscription.status === 'active'
      }
      return false
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error)
      return false
    }
  }

  const checkExistingAccount = async (email) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'dummy_password',
      options: {
        shouldCreateUser: false
      }
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false
          }
        })

        if (signInError) {
          console.error('Erreur lors de la vérification du fournisseur:', signInError)
          return { exists: true, isGoogle: false }
        }

        return { exists: true, isGoogle: false }
      } else {
        console.error('Erreur lors de la vérification de l\'email:', error)
        return { exists: false, isGoogle: false }
      }
    }

    return { exists: false, isGoogle: false }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { exists, isGoogle } = await checkExistingAccount(email)
        if (exists) {
          if (isGoogle) {
            setMessage('Un compte Google avec cette adresse e-mail existe déjà. Veuillez vous connecter avec Google.')
          } else {
            setMessage('Un compte avec cette adresse e-mail existe déjà. Veuillez vous connecter ou utiliser une autre adresse.')
          }
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nom,
              prenom,
            }
          }
        })
        if (error) throw error

        console.log('Utilisateur inscrit avec succès:', data.user)
        await createProfile(data.user.id, { nom, prenom })

        setMessage('Inscription réussie ! Vérifiez votre email pour confirmer.')
        setLoading(false)
        return
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error

        console.log('Utilisateur connecté avec succès:', data.user)
        await createProfile(data.user.id, { nom: data.user.user_metadata.nom || '', prenom: data.user.user_metadata.prenom || '' })

        const hasSubscription = await checkSubscription(data.user.id)
        console.log('A un abonnement actif:', hasSubscription)
        if (hasSubscription) {
          router.push('/espace-adherents')
        } else {
          router.push('/adhesion')
        }
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la soumission du formulaire:', error)
      setMessage(`Une erreur est survenue : ${error.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Erreur lors de la connexion avec Google:', error)
      setMessage(`Erreur de connexion Google : ${error.message || 'Erreur inconnue'}`)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Veuillez entrer votre adresse email.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setMessage('Un email de réinitialisation du mot de passe a été envoyé.')
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error)
      setMessage(`Erreur de réinitialisation : ${error.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.titleContainer}>{isSignUp ? 'Inscription' : 'Connectez vous !'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
        </button>
      </form>
      {!isSignUp && (
        <button onClick={handleForgotPassword} className={styles.switchMode} disabled={loading}>
          Mot de passe oublié ?
        </button>
      )}
      <button onClick={handleGoogleSignIn} className={styles.googleButton} disabled={loading}>
        Se connecter avec Google
      </button>
      <p onClick={() => setIsSignUp(!isSignUp)} className={styles.switchMode}>
        {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
      </p>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}

