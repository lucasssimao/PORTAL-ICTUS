import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Admin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function run() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        navigate('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        navigate('/dashboard')
        return
      }

      if (mounted) setLoading(false)
    }

    run()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/')
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin</h2>
      <p>Área administrativa.</p>
    </div>
  )
}
