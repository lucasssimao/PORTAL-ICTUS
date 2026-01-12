import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Account() {
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
  }, [])

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

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Minha Ficha</h2>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              border: '1px solid #ddd',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{name || 'Sem nome'}</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>{email}</div>
          </div>

          <button type="button" onClick={() => navigate('/change-password')}>
            Trocar senha
          </button>
        </div>

        <div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          {uploading && <div>Enviando foto...</div>}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <Row label="Nome completo:" value={name || '—'} />
          <Row label="E-mail:" value={email || '—'} />
          <Row label="Telefone:" value={phone || '—'} />
          <Row label="Modalidade:" value={modality || '—'} />
          <Row label="Início em:" value={startDate || '—'} />
        </div>

        {!editing ? (
          <button type="button" onClick={() => setEditing(true)}>
            Editar informações
          </button>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Editar</div>

            <label>
              Nome completo
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>

            <label>
              Telefone
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={saveEdits}>
                Salvar
              </button>
              <button
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

        {msg && <div style={{ fontSize: 14 }}>{msg}</div>}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ width: 130, fontWeight: 700 }}>{label}</div>
      <div>{value}</div>
    </div>
  )
}
