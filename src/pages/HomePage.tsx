import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const allCards = [
  {
    path: '/bao-cao-hoat-dong-tram',
    label: 'Báo cáo hoạt động hằng tháng của trạm',
    color: '#1a73e8',
    initial: 'BC',
    roles: null,
  },
  {
    path: '/bao-cao-tong-hop',
    label: 'Báo cáo tổng hợp',
    color: '#2e7d32',
    initial: 'TH',
    roles: ['tonghop'],
  },
]

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const cards = allCards.filter(c => !c.roles || c.roles.includes(user?.username ?? ''))

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Hệ thống quản lý trạm y tế</span>
        <div style={s.headerRight}>
          <span style={s.username}>{user?.fullname || user?.username}</span>
          <button onClick={() => navigate('/logout')} style={s.logoutBtn}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={s.content}>
        <p style={s.welcome}>Xin chào, <strong>{user?.fullname || user?.username}</strong>!</p>
        <div style={s.grid}>
          {cards.map((card) => (
            <div key={card.path} style={s.card} onClick={() => navigate(card.path)}>
              <div style={{ ...s.cardIcon, background: card.color }}>{card.initial}</div>
              <span style={s.cardLabel}>{card.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  username: { fontSize: '0.875rem', color: '#555' },
  logoutBtn: {
    padding: '0.35rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#333',
  },
  content: { padding: '2rem 1.5rem' },
  welcome: { margin: '0 0 1.5rem', fontSize: '1rem', color: '#444' },
  grid: { display: 'flex', flexWrap: 'wrap' as const, gap: '1rem' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '200px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.8rem',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    transition: 'box-shadow 0.15s',
  },
  cardIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
  },
  cardLabel: { fontSize: '0.875rem', fontWeight: 600, color: '#1a1a2e', textAlign: 'center' as const },
}
