import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) setMsg(error.message)
    else {
      setMsg('Senha atualizada.')
      setTimeout(() => navigate('/account'), 1200)
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Trocar senha</h2>

      <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
        <input
          type="password"
          placeholder="Digite a nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
