import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface CccdRecord {
  id: string
  cccd_number: string
  full_name: string
  date_of_birth: string
  gender: string
  address: string | null
  issue_date: string | null
  created_at: string
}

export function CccdPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<CccdRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // key = `${recordId}-${fieldName}` để biết field nào đang được copy
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [])

  async function fetchRecords() {
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('cccd_data')
      .select('id, cccd_number, full_name, date_of_birth, gender, address, issue_date, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setRecords(data ?? [])
    }
    setIsLoading(false)
  }

  function copyField(recordId: string, fieldName: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(`${recordId}-${fieldName}`)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={s.backBtn}>← Trang chủ</button>
        <span style={s.headerTitle}>Danh sách bệnh nhân</span>
        <div style={{ width: 110 }} />
      </div>

      <div style={s.content}>
        {isLoading ? (
          <div style={s.center}>Đang tải...</div>
        ) : error ? (
          <div style={s.center}>
            <p style={{ color: '#c62828', marginBottom: '0.75rem' }}>Lỗi: {error}</p>
            <button onClick={fetchRecords} style={s.retryBtn}>Thử lại</button>
          </div>
        ) : records.length === 0 ? (
          <div style={s.center}>Chưa có dữ liệu CCCD.</div>
        ) : (
          <>
            <p style={s.hint}>Click vào từng trường để copy</p>
            <div style={s.list}>
              {records.map(record => (
                <div key={record.id} style={s.card}>
                  <div
                    style={{ ...s.name, cursor: 'pointer' }}
                    onClick={() => copyField(record.id, 'name', record.full_name.toUpperCase())}
                    title="Click để copy tên"
                  >
                    {record.full_name.toUpperCase()}
                    {copiedKey === `${record.id}-name` && (
                      <span style={s.nameCopied}> ✓ Đã copy</span>
                    )}
                  </div>
                  <div style={s.fields}>
                    <CopyField
                      label="Số CCCD"
                      value={record.cccd_number}
                      isCopied={copiedKey === `${record.id}-cccd`}
                      onClick={() => copyField(record.id, 'cccd', record.cccd_number)}
                    />
                    <CopyField
                      label="Ngày sinh"
                      value={record.date_of_birth}
                      isCopied={copiedKey === `${record.id}-dob`}
                      onClick={() => copyField(record.id, 'dob', record.date_of_birth)}
                    />
                    <CopyField
                      label="Giới tính"
                      value={record.gender}
                      isCopied={copiedKey === `${record.id}-gender`}
                      onClick={() => copyField(record.id, 'gender', record.gender)}
                    />
                    {record.issue_date && (
                      <CopyField
                        label="Ngày cấp"
                        value={record.issue_date}
                        isCopied={copiedKey === `${record.id}-issue`}
                        onClick={() => copyField(record.id, 'issue', record.issue_date!)}
                      />
                    )}
                    {record.address && (
                      <CopyField
                        label="Địa chỉ"
                        value={record.address}
                        isCopied={copiedKey === `${record.id}-address`}
                        onClick={() => copyField(record.id, 'address', record.address!)}
                        wide
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CopyField({
  label,
  value,
  isCopied,
  onClick,
  wide = false,
}: {
  label: string
  value: string
  isCopied: boolean
  onClick: () => void
  wide?: boolean
}) {
  return (
    <div
      style={{ ...s.field, ...(wide ? s.fieldWide : {}), ...(isCopied ? s.fieldCopied : {}) }}
      onClick={onClick}
      title={`Click để copy ${label}`}
    >
      <span style={s.fieldLabel}>{label}</span>
      <span style={s.fieldValue}>{value}</span>
      {isCopied && <span style={s.copiedMark}>✓ Đã copy</span>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerTitle: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' },
  backBtn: {
    padding: '0.35rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#333',
    width: 110,
    textAlign: 'left',
  },
  content: { padding: '1.25rem 1.5rem', flex: 1 },
  hint: { fontSize: '0.82rem', color: '#aaa', marginBottom: '0.75rem', textAlign: 'center' },
  center: { textAlign: 'center', padding: '3rem', color: '#666' },
  retryBtn: {
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#1a73e8',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '760px',
    margin: '0 auto',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  name: {
    fontWeight: 800,
    fontSize: '1.15rem',
    color: '#1a1a2e',
    letterSpacing: '0.02em',
  },
  fields: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #eee',
    background: '#fafafa',
    cursor: 'pointer',
    minWidth: '130px',
    transition: 'border-color 0.15s, background 0.15s',
    position: 'relative',
  },
  fieldWide: {
    flex: '1 1 100%',
  },
  fieldCopied: {
    borderColor: '#1a73e8',
    background: '#e8f0fe',
  },
  fieldLabel: {
    fontSize: '0.72rem',
    color: '#888',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  fieldValue: {
    fontSize: '1rem',
    color: '#1a1a2e',
    fontWeight: 600,
  },
  copiedMark: {
    fontSize: '0.72rem',
    color: '#1a73e8',
    fontWeight: 700,
    marginTop: '0.1rem',
  },
  nameCopied: {
    fontSize: '0.8rem',
    color: '#1a73e8',
    fontWeight: 700,
    marginLeft: '0.5rem',
  },
}
