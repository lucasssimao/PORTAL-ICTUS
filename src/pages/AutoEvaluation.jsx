import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Header from '../components/Header'

export default function AutoEvaluation() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: '',
    weight: '',
    neck: '',
    thorax: '',
    biceps_right: '',
    biceps_left: '',
    waist: '',
    abdomen: '',
    hip: '',
    mid_thigh_right: '',
    mid_thigh_left: '',
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        navigate('/')
        return
      }

      if (!mounted) return
      setLoading(false)
    }

    load()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/')
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      setSaving(false)
      navigate('/')
      return
    }

    await supabase
      .from('auto_evaluations')
      .update({ cycle: 'Antiga' })
      .eq('user_id', user.id)
      .eq('cycle', 'Atual')

    const payload = {
      user_id: user.id,
      date: form.date,
      cycle: 'Atual',
      weight: form.weight === '' ? null : Number(form.weight),
      neck: form.neck === '' ? null : Number(form.neck),
      thorax: form.thorax === '' ? null : Number(form.thorax),
      biceps_right: form.biceps_right === '' ? null : Number(form.biceps_right),
      biceps_left: form.biceps_left === '' ? null : Number(form.biceps_left),
      waist: form.waist === '' ? null : Number(form.waist),
      abdomen: form.abdomen === '' ? null : Number(form.abdomen),
      hip: form.hip === '' ? null : Number(form.hip),
      mid_thigh_right: form.mid_thigh_right === '' ? null : Number(form.mid_thigh_right),
      mid_thigh_left: form.mid_thigh_left === '' ? null : Number(form.mid_thigh_left),
    }

    const { error } = await supabase.from('auto_evaluations').insert(payload)

    if (error) setMsg(error.message)
    else {
      setMsg('Autoavaliação enviada com sucesso.')
      setTimeout(() => navigate('/dashboard'), 1200)
    }

    setSaving(false)
  }

  const { data: supportImageData } = supabase.storage
    .from('portal-assets')
    .getPublicUrl('Onboarding/guia-medidas.jpeg')
  const supportImageUrl = supportImageData?.publicUrl

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}>
      <Header />

      <div style={{ maxWidth: 980, margin: '24px auto 0', padding: '0 10px' }}>
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#fff',
            padding: 20,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, color: '#0f172a' }}>
            Guia de medidas
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
            Use esta imagem como apoio para preencher o formulário corretamente.
          </div>
          {supportImageUrl ? (
            <img
              src={supportImageUrl}
              alt="Guia de medidas"
              style={{ width: '100%', borderRadius: 12, border: '1px solid #e2e8f0' }}
            />
          ) : (
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              Não foi possível carregar a imagem de apoio.
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '16px auto 0', padding: 10 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            padding: 35,
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a' }}>Autoavaliação</div>
              <div style={{ marginTop: 6, color: '#64748b' }}>
                Preencha e envie. Após enviar, não é possível editar.
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                padding: '8px 14px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 10, display: 'grid', gap: 16 }}>
            <Field label="Data" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 35 }}>
              <NumField label="Peso" value={form.weight} onChange={(v) => setField('weight', v)} />
              <NumField label="Pescoço" value={form.neck} onChange={(v) => setField('neck', v)} />
              <NumField label="Tórax" value={form.thorax} onChange={(v) => setField('thorax', v)} />
              <NumField label="Bíceps (dir)" value={form.biceps_right} onChange={(v) => setField('biceps_right', v)} />
              <NumField label="Bíceps (esq)" value={form.biceps_left} onChange={(v) => setField('biceps_left', v)} />
              <NumField label="Cintura" value={form.waist} onChange={(v) => setField('waist', v)} />
              <NumField label="Abdômen" value={form.abdomen} onChange={(v) => setField('abdomen', v)} />
              <NumField label="Quadril" value={form.hip} onChange={(v) => setField('hip', v)} />
              <NumField
                label="Coxa média (dir)"
                value={form.mid_thigh_right}
                onChange={(v) => setField('mid_thigh_right', v)}
              />
              <NumField
                label="Coxa média (esq)"
                value={form.mid_thigh_left}
                onChange={(v) => setField('mid_thigh_left', v)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Enviando...' : 'Enviar autoavaliação'}
              </button>
            </div>

            {msg && <div style={{ marginTop: 6, color: '#0f172a' }}>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  outline: 'none',
}

function Field({ label, children, required }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontWeight: 700, color: '#0f172a' }}>
      {label} {required ? <span style={{ fontWeight: 400, opacity: 0.6 }}>(obrigatório)</span> : null}
      <div style={{ fontWeight: 400 }}>{children}</div>
    </label>
  )
}

function NumField({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontWeight: 700, color: '#0f172a' }}>
      {label}
      <input
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  )
}
