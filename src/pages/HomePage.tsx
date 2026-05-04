import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Xin chào, {user?.username}!</h1>
      <p>Bạn đã đăng nhập thành công.</p>
      <button
        onClick={() => navigate('/logout')}
        style={{
          marginTop: '1rem',
          padding: '0.6rem 1.4rem',
          borderRadius: '8px',
          border: 'none',
          background: '#aa3bff',
          color: '#fff',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Đăng xuất
      </button>
    </div>
  )
}
