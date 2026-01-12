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

    // 1) Marca avaliações atuais como Antiga
    await supabase
      .from('auto_evaluations')
      .update({ cycle: 'Antiga' })
      .eq('user_id', user.id)
      .eq('cycle', 'Atual')

    // 2) Insere nova avaliação como Atual
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

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Header />

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 20 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e5e5',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>Autoavaliação</div>
              <div style={{ marginTop: 6, opacity: 0.7 }}>
                Preencha e envie. Após enviar, não é possível editar.
              </div>
            </div>

            <button type="button" onClick={() => navigate('/dashboard')}>
              Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 14 }}>
            <Field label="Data" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <NumField label="Peso" value={form.weight} onChange={(v) => setField('weight', v)} />
              <NumField label="Pescoço" value={form.neck} onChange={(v) => setField('neck', v)} />
              <NumField label="Tórax" value={form.thorax} onChange={(v) => setField('thorax', v)} />
              <NumField label="Bíceps (dir)" value={form.biceps_right} onChange={(v) => setField('biceps_right', v)} />
              <NumField label="Bíceps (esq)" value={form.biceps_left} onChange={(v) => setField('biceps_left', v)} />
              <NumField label="Cintura" value={form.waist} onChange={(v) => setField('waist', v)} />
              <NumField label="Abdômen" value={form.abdomen} onChange={(v) => setField('abdomen', v)} />
              <NumField label="Quadril" value={form.hip} onChange={(v) => setField('hip', v)} />
              <NumField label="Coxa média (dir)" value={form.mid_thigh_right} onChange={(v) => setField('mid_thigh_right', v)} />
              <NumField label="Coxa média (esq)" value={form.mid_thigh_left} onChange={(v) => setField('mid_thigh_left', v)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="submit" disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar autoavaliação'}
              </button>
            </div>

            {msg && <div style={{ marginTop: 6 }}>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
      {label} {required ? <span style={{ fontWeight: 400, opacity: 0.6 }}>(obrigatório)</span> : null}
      <div style={{ fontWeight: 400 }}>{children}</div>
    </label>
  )
}

function NumField({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
      {label}
      <input
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      />
    </label>
  )
}
