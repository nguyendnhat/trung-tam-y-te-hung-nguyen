import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type UserItem = { username: string; fullname: string }

const PROTECTED_USERNAME = 'tonghop'

export function LoginPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<UserItem | null>(null)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
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
        setLoading(false)
      })
  }, [])

  const handleSelect = (u: UserItem) => {
    if (u.username === PROTECTED_USERNAME) {
      setPending(u)
      setPassword('')
      setPwError('')
      setTimeout(() => passwordRef.current?.focus(), 50)
    } else {
      login(u.username, u.fullname ?? '')
      navigate('/', { replace: true })
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pending) return
    setPwLoading(true)
    setPwError('')
    const { data } = await supabase
      .rpc('check_login', { p_username: pending.username, p_password: password })
      .maybeSingle() as { data: { username: string; fullname: string } | null; error: unknown }
    setPwLoading(false)
    if (!data) {
      setPwError('Mật khẩu không đúng.')
      return
    }
    login(data.username, data.fullname ?? '')
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
              <div
                key={u.username}
                style={pending?.username === u.username ? { ...s.userItem, ...s.userItemActive } : s.userItem}
                onClick={() => handleSelect(u)}
              >
                <div style={{ ...s.avatar, background: u.username === PROTECTED_USERNAME ? '#2e7d32' : '#1a73e8' }}>
                  {(u.fullname || u.username).charAt(0).toUpperCase()}
                </div>
                <div style={s.userInfo}>
                  <span style={s.fullname}>{u.fullname || u.username}</span>
                  <span style={s.username}>{u.username}</span>
                </div>
                {u.username === PROTECTED_USERNAME && (
                  <span style={s.lockBadge}>🔒</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Password prompt for protected account */}
        {pending && (
          <form onSubmit={handlePasswordSubmit} style={s.pwForm}>
            <p style={s.pwPrompt}>
              Nhập mật khẩu cho tài khoản <strong>{pending.fullname || pending.username}</strong>:
            </p>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError('') }}
              placeholder="Mật khẩu"
              style={s.pwInput}
              autoComplete="current-password"
            />
            {pwError && <p style={s.pwError}>{pwError}</p>}
            <div style={s.pwActions}>
              <button type="button" onClick={() => setPending(null)} style={s.cancelBtn}>Hủy</button>
              <button type="submit" disabled={pwLoading || !password} style={s.submitBtn}>
                {pwLoading ? 'Đang kiểm tra...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
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
  loading: { textAlign: 'center', color: '#888', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e8e8e8',
    background: '#fafafa',
    cursor: 'pointer',
  },
  userItemActive: {
    border: '1px solid #1a73e8',
    background: '#e8f0fe',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 },
  fullname: { fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e' },
  username: { fontSize: '0.8rem', color: '#888' },
  lockBadge: { fontSize: '0.9rem', marginLeft: 'auto' },
  pwForm: {
    marginTop: '1.5rem',
    padding: '1.2rem',
    background: '#f8faff',
    borderRadius: '10px',
    border: '1px solid #c5d8fb',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
  },
  pwPrompt: { margin: 0, fontSize: '0.9rem', color: '#333' },
  pwInput: {
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    color: '#1a1a2e',
    outline: 'none',
  },
  pwError: { margin: 0, color: '#d32f2f', fontSize: '0.85rem' },
  pwActions: { display: 'flex', gap: '0.7rem', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#555',
  },
  submitBtn: {
    padding: '0.45rem 1.2rem',
    borderRadius: '6px',
    border: 'none',
    background: '#2e7d32',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
}
