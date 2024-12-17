'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from '../Adhesion.module.css'

export default function SuccessPage() {
  const [message, setMessage] = useState('Vérification de votre abonnement...')
  const router = useRouter()

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setMessage('Erreur : Utilisateur non connecté')
          return
        }

        // Vérifier si le profil existe et mettre à jour le statut d'adhérent
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_adherent: true })
          .eq('id', user.id)
          .select()
          .single()

        if (error) {
          throw new Error('Erreur lors de la mise à jour du profil')
        }

        setMessage('Félicitations ! Votre abonnement a été activé avec succès.')
        setTimeout(() => {
          router.push('/espace-adherents')
        }, 3000)
      } catch (error) {
        console.error('Erreur:', error)
        setMessage(`Une erreur est survenue : ${error.message}`)
      }
    }

    verifySubscription()
  }, [router])

  return (
    <div className={styles.container}>
      <h1>Confirmation d'abonnement</h1>
      <p>{message}</p>
    </div>
  )
}

