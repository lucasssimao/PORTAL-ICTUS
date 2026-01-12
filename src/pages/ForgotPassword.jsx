import { useState } from 'react'
import { supabase } from '../supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password',
    })

    if (error) setMsg(error.message)
    else setMsg('Enviei um e-mail com o link para redefinir a senha.')

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Esqueci minha senha</h2>

      <form onSubmit={handleSend} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
