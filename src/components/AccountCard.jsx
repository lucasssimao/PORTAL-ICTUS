import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../pages/Account.css'

export default function AccountCard({ onClose }) {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [modality, setModality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setMsg('')
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        navigate('/')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, phone, modality, start_date, avatar_url')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (error) {
        setMsg(error.message)
        setLoading(false)
        return
      }

      setEmail(user.email || '')
      setName(profile?.name || '')
      setPhone(profile?.phone || '')
      setModality(profile?.modality || '')
      setStartDate(profile?.start_date || '')
      setAvatarUrl(profile?.avatar_url || '')

      setEditName(profile?.name || '')
      setEditPhone(profile?.phone || '')

      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [navigate])

  async function saveEdits() {
    setMsg('')

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ name: editName, phone: editPhone })
      .eq('id', user.id)

    if (error) {
      setMsg(error.message)
      return
    }

    setName(editName)
    setPhone(editPhone)
    setEditing(false)
    setMsg('Informações atualizadas.')
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMsg('')

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMsg(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (dbError) {
      setMsg(dbError.message)
      setUploading(false)
      return
    }

    setAvatarUrl(publicUrl)
    setUploading(false)
    setMsg('Foto atualizada.')
  }

  const initials = (name || email || '?')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  if (loading) return <div className="account-card">Carregando...</div>

  return (
    <div className="account-card">
      <div className="account-header">
        {onClose && (
          <button className="account-close" type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        )}
        <div className="account-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" role="img" aria-label="">
            <path
              d="M32 12c6 0 10 4 10 10 0 8-10 16-10 16s-10-8-10-16c0-6 4-10 10-10Z"
              fill="#c9f5ee"
            />
            <path
              d="M20 36c6 0 12 3 12 8-5 1-10 2-12 6-2-4-2-10 0-14Z"
              fill="#92e6d6"
            />
            <path
              d="M44 36c-6 0-12 3-12 8 5 1 10 2 12 6 2-4 2-10 0-14Z"
              fill="#5bc8b5"
            />
          </svg>
        </div>
        <h1>Bem-vindo de volta</h1>
        <p>Atualize seus dados para continuar.</p>
      </div>

      <div className="account-profile">
        <div className="account-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span>{initials}</span>}
        </div>

        <div className="account-profile-info">
          <div className="account-name">{name || 'Sem nome'}</div>
          <div className="account-email">{email}</div>
        </div>

        <button
          className="account-button ghost"
          type="button"
          onClick={() => navigate('/change-password')}
        >
          Trocar senha
        </button>
      </div>

      <div className="account-upload">
        <label className="account-file">
          Atualizar foto
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
        </label>
        {uploading && <div className="account-help">Enviando foto...</div>}
      </div>

      <div className="account-info">
        <Row label="Nome completo" value={name || '—'} />
        <Row label="E-mail" value={email || '—'} />
        <Row label="Telefone" value={phone || '—'} />
        <Row label="Modalidade" value={modality || '—'} />
        <Row label="Início em" value={startDate || '—'} />
      </div>

      {!editing ? (
        <button className="account-button primary" type="button" onClick={() => setEditing(true)}>
          Editar informações
        </button>
      ) : (
        <div className="account-edit">
          <div className="account-section-title">Editar</div>

          <label className="account-field">
            Nome completo
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </label>

          <label className="account-field">
            Telefone
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </label>

          <div className="account-actions">
            <button className="account-button primary" type="button" onClick={saveEdits}>
              Salvar
            </button>
            <button
              className="account-button ghost"
              type="button"
              onClick={() => {
                setEditName(name)
                setEditPhone(phone)
                setEditing(false)
                setMsg('')
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {msg && <div className="account-help">{msg}</div>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="account-row">
      <div className="account-label">{label}</div>
      <div className="account-value">{value}</div>
    </div>
    

  )
}
