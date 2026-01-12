import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Header from '../components/Header'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [newStatus, setNewStatus] = useState('') // vazio por default

  // Upload PDF
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfTitle, setPdfTitle] = useState('')
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (profile?.role !== 'admin') {
        setIsAdmin(false)
        setLoading(false)
        setMsg('Acesso negado.')
        return
      }

      setIsAdmin(true)

      const { data, error } = await supabase
        .from('admin_students')
        .select('*')
        .order('name', { ascending: true })

      if (error) setMsg(error.message)

      const list = data || []
      setStudents(list)
      if (list.length > 0) setSelectedId(list[0].user_id)

      setLoading(false)
    }

    load()
    return () => (mounted = false)
  }, [])

  const selectedStudent = useMemo(
    () => students.find((s) => s.user_id === selectedId),
    [students, selectedId]
  )

  const countsNow = useMemo(() => {
    const c = { Ativo: 0, Pausado: 0, Inativo: 0 }
    for (const s of students) {
      if (s.status === 'Pausado') c.Pausado++
      else if (s.status === 'Inativo') c.Inativo++
      else c.Ativo++
    }
    return c
  }, [students])

  // Gráfico de colunas por mês (snapshot simples)
  const chartData = useMemo(() => {
    if (!students.length) return []

    const monthsSet = new Set()
    for (const s of students) {
      if (s.user_created_at) monthsSet.add(new Date(s.user_created_at).toISOString().slice(0, 7))
      if (s.status_changed_at) monthsSet.add(new Date(s.status_changed_at).toISOString().slice(0, 7))
    }

    const months = Array.from(monthsSet).sort((a, b) => a.localeCompare(b))
    if (!months.length) return []

    const rows = months.map((m) => ({ month: m, Ativo: 0, Pausado: 0, Inativo: 0 }))

    for (const s of students) {
      const createdMonth = s.user_created_at
        ? new Date(s.user_created_at).toISOString().slice(0, 7)
        : null

      for (const row of rows) {
        if (createdMonth && row.month < createdMonth) continue
        const st = s.status === 'Pausado' ? 'Pausado' : s.status === 'Inativo' ? 'Inativo' : 'Ativo'
        row[st]++
      }
    }

    return rows
  }, [students])

  async function applyStatusChange() {
    setMsg('')
    if (!selectedStudent) return
    if (!newStatus) {
      setMsg('Selecione um status antes de alterar.')
      return
    }

    const payload = {
      status: newStatus,
      status_changed_at: new Date().toISOString(),
      inactivated_at: newStatus === 'Inativo' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', selectedStudent.user_id)
    if (error) {
      setMsg(error.message)
      return
    }

    setStudents((prev) =>
      prev.map((s) => (s.user_id === selectedStudent.user_id ? { ...s, ...payload } : s))
    )

    setNewStatus('')
    setMsg('Status atualizado.')
  }

  async function toggleAutoEval() {
    setMsg('')
    if (!selectedStudent) return

    const { error } = await supabase
      .from('profiles')
      .update({ auto_eval_enabled: !selectedStudent.auto_eval_enabled })
      .eq('id', selectedStudent.user_id)

    if (error) {
      setMsg(error.message)
      return
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.user_id === selectedStudent.user_id
          ? { ...s, auto_eval_enabled: !selectedStudent.auto_eval_enabled }
          : s
      )
    )
    setMsg('Autoavaliação atualizada.')
  }

  async function uploadPdf() {
    setMsg('')
    if (!selectedStudent) return
    if (!pdfFile) {
      setMsg('Selecione um arquivo PDF.')
      return
    }

    // validação simples
    const isPdf =
      pdfFile.type === 'application/pdf' || pdfFile.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setMsg('O arquivo precisa ser PDF.')
      return
    }

    try {
      setUploading(true)

      const safeName = pdfFile.name.replace(/[^\w.\-]+/g, '_')
      const path = `${selectedStudent.user_id}/${Date.now()}-${safeName}`

      const { error: upErr } = await supabase
        .storage
        .from('avaliacoes-pdf')
        .upload(path, pdfFile, { upsert: false })

      if (upErr) {
        setMsg(upErr.message)
        return
      }

      const { error: insErr } = await supabase
        .from('evaluations')
        .insert({
          user_id: selectedStudent.user_id,
          title: pdfTitle || 'Avaliação Fotogramétrica',
          file_path: path,
        })

      if (insErr) {
        setMsg(insErr.message)
        return
      }

      setPdfFile(null)
      setPdfTitle('')
      // limpa o input visualmente
      const el = document.getElementById('pdf-input')
      if (el) el.value = ''

      setMsg('PDF enviado e vinculado ao aluno.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Carregando...</div>
  if (!isAdmin) return <div style={{ padding: 20 }}>{msg}</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Header />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.35fr 0.65fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 18,
                border: '1px solid #e5e5e5',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 24 }}>Admin — Alunos</div>
              <div style={{ marginTop: 6, opacity: 0.7 }}>Visão geral e gestão rápida.</div>
              {msg && <div style={{ marginTop: 10 }}>{msg}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <StatusCard title="Ativos" value={countsNow.Ativo} color="#2ecc71" />
              <StatusCard title="Pausados" value={countsNow.Pausado} color="#f1c40f" />
              <StatusCard title="Inativos" value={countsNow.Inativo} color="#e74c3c" />
            </div>

            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #e5e5e5',
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Evolução mensal (status)</div>
              <div style={{ height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Ativo" fill="#2ecc71" />
                    <Bar dataKey="Pausado" fill="#f1c40f" />
                    <Bar dataKey="Inativo" fill="#e74c3c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #e5e5e5',
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Ações rápidas</div>

              <div style={{ display: 'grid', gap: 10 }}>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value)
                    setNewStatus('')
                    setMsg('')
                    setPdfFile(null)
                    setPdfTitle('')
                    const el = document.getElementById('pdf-input')
                    if (el) el.value = ''
                  }}
                  style={{ padding: 10, borderRadius: 10 }}
                >
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {(s.name || 'Sem nome') + ' — ' + (s.email || 'sem email')}
                    </option>
                  ))}
                </select>

                {selectedStudent ? (
                  <>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      Status atual: <b>{selectedStudent.status || 'Ativo'}</b>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{ padding: 10, borderRadius: 10 }}
                      >
                        <option value="">Selecione novo status…</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Inativo">Inativo</option>
                      </select>

                      <button type="button" onClick={applyStatusChange}>
                        Alterar status
                      </button>
                    </div>

                    <button type="button" onClick={toggleAutoEval}>
                      {selectedStudent.auto_eval_enabled
                        ? 'Fechar autoavaliação'
                        : 'Liberar autoavaliação'}
                    </button>

                    <div
                      style={{
                        marginTop: 6,
                        paddingTop: 10,
                        borderTop: '1px solid #eee',
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>Upload PDF (fotogrametria)</div>

                      <input
                        id="pdf-input"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      />

                      <input
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        placeholder="Título (opcional) — ex: Avaliação 2026-01"
                        style={{ padding: 10, borderRadius: 10 }}
                      />

                      <button type="button" onClick={uploadPdf} disabled={uploading}>
                        {uploading ? 'Enviando...' : 'Enviar PDF'}
                      </button>

                      <div style={{ fontSize: 12, opacity: 0.65 }}>
                        Esse PDF vai aparecer automaticamente no portal do aluno.
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.7 }}>Selecione um aluno.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ title, value, color }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: 14,
        border: `2px solid ${color}`,
        background: '#fff',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.85 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 950, color, marginTop: 6 }}>{value}</div>
    </div>
  )
}
