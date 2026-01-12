import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()   // TEM que estar aqui dentro do componente

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMsg(error.message)
    } else {
      const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    setMsg('Erro ao buscar perfil')
    setLoading(false)
    return
  }

  if (profile.role === 'admin') navigate('/admin')
  else navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
         <a href="/forgot-password" style={{ fontSize: 14 }}>
    Esqueci minha senha
  </a>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
