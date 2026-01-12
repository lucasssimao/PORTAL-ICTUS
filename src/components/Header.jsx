import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #e5e5e5',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: '#f2f2f2',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
          }}
          title="ICTUS"
        >
          I
        </div>

        <div style={{ fontWeight: 800 }}>ICTUS</div>
      </div>

      <button type="button" onClick={() => navigate('/account')}>
        Minha conta
      </button>
    </div>
  )
}
