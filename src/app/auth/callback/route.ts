import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // Vérifier si le profil existe déjà
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Le profil n'existe pas, créons-le
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            nom: user.user_metadata?.full_name?.split(' ')[0] || '',
            prenom: user.user_metadata?.full_name?.split(' ')[1] || '',
            is_adherent: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erreur lors de la création du profil:', insertError)
        } else {
          profile = newProfile
        }
      }

      // Vérifier l'abonnement
      try {
        const response = await fetch(`${requestUrl.origin}/api/get-subscription?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Données d\'abonnement:', data)
          if (data.subscription && data.subscription.status === 'active') {
            return NextResponse.redirect(requestUrl.origin + '/espace-adherents')
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'abonnement:', error)
      }
    }
  }

  // Si pas d'abonnement actif ou erreur, rediriger vers la page d'adhésion
  return NextResponse.redirect(requestUrl.origin + '/adhesion')
}

