import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type UserItem = { username: string; fullname: string }

export function LoginPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('users')
      .select('username, fullname')
      .order('fullname')
      .then(({ data }) => {
        if (data) setUsers(data as UserItem[])
        setLoading(false)
      })
  }, [])

  const handleSelect = (u: UserItem) => {
    login(u.username, u.fullname ?? '')
    navigate('/', { replace: true })
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Hệ thống quản lý trạm y tế</h1>
        <p style={s.subtitle}>Chọn tài khoản để đăng nhập</p>
        {loading ? (
          <p style={s.loading}>Đang tải...</p>
        ) : (
          <div style={s.list}>
            {users.map((u) => (
              <div key={u.username} style={s.userItem} onClick={() => handleSelect(u)}>
                <div style={s.avatar}>{(u.fullname || u.username).charAt(0).toUpperCase()}</div>
                <div style={s.userInfo}>
                  <span style={s.fullname}>{u.fullname || u.username}</span>
                  <span style={s.username}>{u.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  },
  title: {
    margin: '0 0 0.4rem',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 1.8rem',
    fontSize: '0.9rem',
    color: '#888',
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e8e8e8',
    background: '#fafafa',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#1a73e8',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  fullname: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  username: {
    fontSize: '0.8rem',
    color: '#888',
  },
}
