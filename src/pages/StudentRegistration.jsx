import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { supabase } from '../supabase'
import './StudentRegistration.css'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  birthDate: '',
  contractDate: '',
  addressStreet: '',
  addressNumber: '',
  addressCity: '',
  addressState: '',
  addressZip: '',
  addressComplement: '',
  gender: '',
  rg: '',
  cpf: '',
  profession: '',
  modality: '',
  pilatesPlan: '',
  doctorName: '',
  doctorCrm: '',
  history: '',
  evolution: '',
}

const TABLE_NAME = 'patient_records'

function mapRowToForm(row) {
  return {
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    birthDate: row.birth_date ?? '',
    contractDate: row.contract_date ?? '',
    addressStreet: row.address_street ?? '',
    addressNumber: row.address_number ?? '',
    addressCity: row.address_city ?? '',
    addressState: row.address_state ?? '',
    addressZip: row.address_zip ?? '',
    addressComplement: row.address_complement ?? '',
    gender: row.gender ?? '',
    rg: row.rg ?? '',
    cpf: row.cpf ?? '',
    profession: row.profession ?? '',
    modality: row.modality ?? '',
    pilatesPlan: row.pilates_plan ?? '',
    doctorName: row.doctor_name ?? '',
    doctorCrm: row.doctor_crm ?? '',
    history: row.history ?? '',
    evolution: row.evolution ?? '',
  }
}

function mapFormToRow(form) {
  return {
    name: form.name || null,
    phone: form.phone || null,
    email: form.email || null,
    birth_date: form.birthDate || null,
    contract_date: form.contractDate || null,
    address_street: form.addressStreet || null,
    address_number: form.addressNumber || null,
    address_city: form.addressCity || null,
    address_state: form.addressState || null,
    address_zip: form.addressZip || null,
    address_complement: form.addressComplement || null,
    gender: form.gender || null,
    rg: form.rg || null,
    cpf: form.cpf || null,
    profession: form.profession || null,
    modality: form.modality || null,
    pilates_plan: form.pilatesPlan || null,
    doctor_name: form.doctorName || null,
    doctor_crm: form.doctorCrm || null,
    history: form.history || null,
    evolution: form.evolution || null,
  }
}

export default function StudentRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isDirty, setIsDirty] = useState(false)
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        navigate('/')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (error) {
        setMessage(error.message)
      } else {
        setRegistrations(data || [])
      }
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
  }, [navigate])

  const selectedRegistration = useMemo(() => {
    return registrations.find((item) => item.id === selectedId) || null
  }, [registrations, selectedId])

  useEffect(() => {
    if (!selectedRegistration) return
    setForm(mapRowToForm(selectedRegistration))
    setIsDirty(false)
    setMessage('')
    setAttachments([])
  }, [selectedRegistration])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  function handleNewRegistration() {
    if (selectedId && isDirty) {
      alert('Salve o cadastro atual e depois abra uma nova ficha.')
      return
    }
    setSelectedId('')
    setForm(emptyForm)
    setAttachments([])
    setIsDirty(false)
    setMessage('')
  }

  function handleSelectChange(event) {
    const value = event.target.value
    if (selectedId && isDirty) {
      alert('Salve o cadastro atual e depois abra uma nova ficha.')
      return
    }
    setSelectedId(value)
  }

  async function handleSave() {
    if (!userId) {
      setMessage('Sessão expirada. Faça login novamente.')
      return
    }
    setSaving(true)
    setMessage('')
    const payload = mapFormToRow(form)
    payload.owner_id = userId

    let response
    if (selectedId) {
      response = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', selectedId)
        .eq('owner_id', userId)
        .select('*')
        .single()
    } else {
      response = await supabase.from(TABLE_NAME).insert(payload).select('*').single()
    }

    const { data, error } = response
    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    const next = selectedId
      ? registrations.map((item) => (item.id === selectedId ? data : item))
      : [data, ...registrations]

    setRegistrations(next)
    setSelectedId(data.id)
    setIsDirty(false)
    setSaving(false)
    setMessage('Cadastro salvo com sucesso.')
  }

  function handleEvolutionFocus() {
    const today = new Date().toLocaleDateString()
    const prefix = `${today} - `
    if (!form.evolution.trim()) {
      handleChange('evolution', prefix)
      return
    }
    if (!form.evolution.trim().endsWith(prefix)) {
      handleChange('evolution', `${form.evolution}\n${prefix}`)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="registration-page">
      <Header />

      <div className="registration-wrapper">
        <div className="registration-header">
          <h1>Cadastro do aluno</h1>
          <button className="secondary-button" type="button" onClick={() => navigate('/dashboard')}>
            Voltar à página inicial
          </button>
        </div>

        <div className="registration-actions card">
          <button className="primary-button" type="button" onClick={handleNewRegistration}>
            Incluir novo cadastro
          </button>

          <label className="select-field">
            Selecionar cadastro existente
            <select value={selectedId} onChange={handleSelectChange}>
              <option value="">Selecione...</option>
              {registrations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || 'Cadastro sem nome'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form className="registration-card card" onSubmit={(event) => event.preventDefault()}>
          <div className="grid">
            <label>
              Nome
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
              />
            </label>

            <label>
              Telefone
              <input
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
              />
            </label>

            <label>
              Data de nascimento
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => handleChange('birthDate', event.target.value)}
              />
            </label>

            <label>
              Data do contrato
              <input
                type="date"
                value={form.contractDate}
                onChange={(event) => handleChange('contractDate', event.target.value)}
              />
            </label>
          </div>

          {/* resto do form permanece igual */}
          {/* (mantive tudo que você já tinha abaixo) */}

          <div className="footer-actions">
            <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar informações'}
            </button>
            {message && <span className="status">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
