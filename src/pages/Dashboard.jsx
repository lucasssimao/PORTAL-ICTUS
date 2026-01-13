import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Header from '../components/Header'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  const [measures, setMeasures] = useState([])
  const [pdfs, setPdfs] = useState([])
  const [msg, setMsg] = useState('')

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

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (profileErr) setMsg(profileErr.message)

      // ✅ Medidas para o gráfico (TODAS)
      const { data: mData, error: mErr } = await supabase
        .from('auto_evaluations')
        .select(
          `
          date,
          weight,
          neck,
          thorax,
          biceps_right,
          biceps_left,
          waist,
          abdomen,
          hip,
          thigh_mid_right,
          thigh_mid_left
        `
        )
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (mErr) setMsg(mErr.message)
      else setMeasures(mData || [])

      // PDFs do aluno
      const { data: eData, error: eErr } = await supabase
        .from('evaluations')
        .select('id, created_at, title, file_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (eErr) {
        setMsg(eErr.message)
      } else {
        const rows = eData || []
        const withUrls = await Promise.all(
          rows.map(async (row) => {
            const { data: signed, error: sErr } = await supabase.storage
              .from('avaliacoes-pdf')
              .createSignedUrl(row.file_path, 60 * 60) // 1h

            return {
              ...row,
              url: sErr ? null : signed?.signedUrl || null,
            }
          })
        )
        setPdfs(withUrls)
      }

      if (!mounted) return
      setName(profile?.name || '')
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

  // ✅ Transformação para o Recharts (TODAS as medidas)
  const chartData = useMemo(() => {
    return (measures || []).map((r) => ({
      date: r.date,
      Peso: r.weight,
      Pescoco: r.neck,
      Torax: r.thorax,
      Biceps_D: r.biceps_right,
      Biceps_E: r.biceps_left,
      Cintura: r.waist,
      Abdomen: r.abdomen,
      Quadril: r.hip,
      CoxaMedia_D: r.thigh_mid_right,
      CoxaMedia_E: r.thigh_mid_left,
    }))
  }, [measures])

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Header />

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 20, display: 'grid', gap: 20 }}>
        {/* Boas-vindas */}
        <div
          style={{
            background: '#eaf3f6',
            borderRadius: 14,
            padding: 24,
            border: '1px solid #d7e7ee',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.05 }}>
            Bem vindo(a), {name || 'Aluno'}!
          </h1>
          <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.8 }}>
            Acesse seu perfil e histórico de avaliações com facilidade.
          </p>
          {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
        </div>

        {/* Gráfico */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e5e5',
            padding: 16,
            minHeight: 360,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10, fontSize: 18 }}>Evolução</div>

          {chartData.length < 2 ? (
            <div style={{ opacity: 0.7 }}>
              Você ainda não tem histórico suficiente para o gráfico (precisa de 2+ avaliações).
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  {/* ✅ Cada linha com uma cor diferente */}
                  <Line type="monotone" dataKey="Peso" stroke="#1f77b4" />
                  <Line type="monotone" dataKey="Pescoco" stroke="#ff7f0e" />
                  <Line type="monotone" dataKey="Torax" stroke="#2ca02c" />
                  <Line type="monotone" dataKey="Biceps_D" stroke="#d62728" />
                  <Line type="monotone" dataKey="Biceps_E" stroke="#9467bd" />
                  <Line type="monotone" dataKey="Cintura" stroke="#8c564b" />
                  <Line type="monotone" dataKey="Abdomen" stroke="#e377c2" />
                  <Line type="monotone" dataKey="Quadril" stroke="#7f7f7f" />
                  <Line type="monotone" dataKey="CoxaMedia_D" stroke="#bcbd22" />
                  <Line type="monotone" dataKey="CoxaMedia_E" stroke="#17becf" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Histórico de avaliações PDF */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e5e5',
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 22 }}>Histórico de Avaliações</div>
          <div style={{ marginTop: 6, opacity: 0.7 }}>
            Aqui aparecem seus PDFs de avaliação fotogramétrica.
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {pdfs.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Nenhum PDF disponível ainda.</div>
            ) : (
              pdfs.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{p.title || 'Avaliação Fotogramétrica'}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      Enviado em: {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (p.url) window.open(p.url, '_blank', 'noopener,noreferrer')
                    }}
                    disabled={!p.url}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #e3e3e3',
                      background: p.url ? '#fff' : '#f3f3f3',
                      cursor: p.url ? 'pointer' : 'not-allowed',
                      fontWeight: 800,
                    }}
                  >
                    Ver PDF da Avaliação
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sair */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/')
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
