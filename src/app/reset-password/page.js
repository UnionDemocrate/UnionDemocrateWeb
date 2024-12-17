'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import styles from '../auth/Auth.module.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Mot de passe mis à jour avec succès. Redirection vers la page de connexion...')
      setTimeout(() => router.push('/auth'), 3000)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Réinitialiser le mot de passe</h1>
      <form onSubmit={handleResetPassword} className={styles.form}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}

