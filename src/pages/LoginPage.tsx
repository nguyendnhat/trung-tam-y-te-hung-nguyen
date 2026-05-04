import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type UserItem = { username: string; fullname: string }

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserItem[]>([])
  const passwordRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('users')
      .select('username, fullname')
      .order('fullname')
      .then(({ data }) => {
        if (data) setUsers(data as UserItem[])
      })
  }, [])

  const handleSelectUser = (u: UserItem) => {
    setUsername(u.username)
    setError('')
    passwordRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: dbError } = await supabase
      .rpc('check_login', { p_username: username, p_password: password })
      .maybeSingle() as { data: { username: string; fullname: string } | null; error: unknown }

    setLoading(false)

    if (dbError) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
      return
    }

    if (!data) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.')
      return
    }

    login(data.username, data.fullname ?? '')
    navigate('/', { replace: true })
  }

  return (
    <div style={s.page}>
      {/* Danh sách tài khoản - cố định bên trái */}
      {users.length > 0 && (
        <div style={s.userListCard}>
          <h2 style={s.userListTitle}>Chọn tài khoản</h2>
          <div style={s.userList}>
            {users.map((u) => (
              <div
                key={u.username}
                onClick={() => handleSelectUser(u)}
                style={username === u.username ? { ...s.userItem, ...s.userItemActive } : s.userItem}
              >
                <span style={s.userFullname}>{u.fullname || u.username}</span>
                <span style={s.userUsername}>{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form đăng nhập - luôn ở giữa trang */}
      <div style={s.card}>
        <h1 style={s.title}>Đăng nhập</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mật khẩu</label>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={s.input}
            />
          </div>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    position: 'relative',
    padding: '2rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  },
  title: {
    margin: '0 0 1.5rem',
    fontSize: '1.6rem',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.9rem',
    color: '#444',
    fontWeight: 500,
  },
  input: {
    padding: '0.65rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#1a1a2e',
    fontSize: '1rem',
    outline: 'none',
  },
  error: {
    color: '#d32f2f',
    fontSize: '0.875rem',
    margin: 0,
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#aa3bff',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  userListCard: {
    position: 'absolute',
    left: '2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    width: '240px',
    maxHeight: '80vh',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
  userListTitle: {
    margin: '0 0 0.8rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  userList: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  userItem: {
    padding: '0.55rem 0.7rem',
    borderRadius: '7px',
    border: '1px solid #eee',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    background: '#fafafa',
  },
  userItemActive: {
    background: '#e8f0fe',
    border: '1px solid #1a73e8',
  },
  userFullname: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  userUsername: {
    fontSize: '0.78rem',
    color: '#888',
  },
}
