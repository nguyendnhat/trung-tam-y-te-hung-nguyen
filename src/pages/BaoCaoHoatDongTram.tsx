import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type FormData = {
  sogiuongbenhkehoach: string
  solankham: string
  solankhamtreduoi6tuoi: string
  solankhamhongheo: string
  solankhamcanngheo: string
  solankhamyhct: string
  solandieutringoaitru: string
  solandieutrinoitru: string
  solandieutrinoitrunguoingheo: string
  solandieutrinoitrucanngheo: string
  solandieutrinoitruyhct: string
  songaydieutribinhquan: string
  songaydieutrinoitru: string
  congsuatsogiuongbenh: string
  sobenhnhanngodoc: string
  sobenhnhancapcuu: string
  sobenhnhantainan: string
  sobenhnhantainangiaothong: string
  solanxetnghiem: string
  solandetrongvung: string
  solandetaitramofvung: string
  sotresosinhsong: string
  sotuvongtrongthang: string
}

const emptyForm: FormData = {
  sogiuongbenhkehoach: '',
  solankham: '',
  solankhamtreduoi6tuoi: '',
  solankhamhongheo: '',
  solankhamcanngheo: '',
  solankhamyhct: '',
  solandieutringoaitru: '',
  solandieutrinoitru: '',
  solandieutrinoitrunguoingheo: '',
  solandieutrinoitrucanngheo: '',
  solandieutrinoitruyhct: '',
  songaydieutribinhquan: '',
  songaydieutrinoitru: '',
  congsuatsogiuongbenh: '',
  sobenhnhanngodoc: '',
  sobenhnhancapcuu: '',
  sobenhnhantainan: '',
  sobenhnhantainangiaothong: '',
  solanxetnghiem: '',
  solandetrongvung: '',
  solandetaitramofvung: '',
  sotresosinhsong: '',
  sotuvongtrongthang: '',
}

type RowDef =
  | { type: 'main'; stt: number; label: string; field: keyof FormData }
  | { type: 'sub'; label: string; field: keyof FormData }

const rows: RowDef[] = [
  { type: 'main', stt: 1,  label: 'Giường bệnh kế hoạch',                               field: 'sogiuongbenhkehoach' },
  { type: 'main', stt: 2,  label: 'Tổng số lần khám bệnh',                               field: 'solankham' },
  { type: 'sub',           label: 'Trong đó trẻ < 6 tuổi',                               field: 'solankhamtreduoi6tuoi' },
  { type: 'sub',           label: 'Người nghèo',                                          field: 'solankhamhongheo' },
  { type: 'sub',           label: 'Cận nghèo',                                            field: 'solankhamcanngheo' },
  { type: 'sub',           label: 'Số B/n KCB bằng YHCT',                                field: 'solankhamyhct' },
  { type: 'main', stt: 3,  label: 'Số B/n điều trị ngoại trú',                           field: 'solandieutringoaitru' },
  { type: 'main', stt: 4,  label: 'Số B/n điều trị nội trú',                             field: 'solandieutrinoitru' },
  { type: 'sub',           label: 'Người nghèo',                                          field: 'solandieutrinoitrunguoingheo' },
  { type: 'sub',           label: 'Cận nghèo',                                            field: 'solandieutrinoitrucanngheo' },
  { type: 'sub',           label: 'Số B/n KCB bằng YHCT',                                field: 'solandieutrinoitruyhct' },
  { type: 'main', stt: 5,  label: 'Ngày điều trị trung bình',                            field: 'songaydieutribinhquan' },
  { type: 'main', stt: 6,  label: 'Tổng số ngày điều trị nội trú',                       field: 'songaydieutrinoitru' },
  { type: 'main', stt: 7,  label: 'Công suất SD giường bệnh tính theo GB KH (%)',        field: 'congsuatsogiuongbenh' },
  { type: 'main', stt: 8,  label: 'Số BN ngộ độc',                                       field: 'sobenhnhanngodoc' },
  { type: 'main', stt: 9,  label: 'Số bệnh nhân cấp cứu',                                field: 'sobenhnhancapcuu' },
  { type: 'main', stt: 10, label: 'Số bệnh nhân tai nạn',                                field: 'sobenhnhantainan' },
  { type: 'sub',           label: 'Trong đó: TNGT',                                       field: 'sobenhnhantainangiaothong' },
  { type: 'main', stt: 11, label: 'Số lần xét nghiệm',                                   field: 'solanxetnghiem' },
  { type: 'main', stt: 12, label: 'Tổng số đẻ trong xã, thị trấn',                      field: 'solandetrongvung' },
  { type: 'sub',           label: 'Trong đó: Đẻ tại Trạm Y tế xã, Thị trấn',            field: 'solandetaitramofvung' },
  { type: 'main', stt: 13, label: 'Số trẻ sơ sinh sống',                                 field: 'sotresosinhsong' },
  { type: 'main', stt: 14, label: 'Số tử vong trong tháng',                              field: 'sotuvongtrongthang' },
]

const now = new Date()
const toNum = (val: string) => (val === '' ? null : Number(val))

export function BaoCaoHoatDongTram() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    const { data } = await supabase
      .from('hoat_dong_tram_of_thang')
      .select('*')
      .eq('username', user!.username)
      .eq('thang', thang)
      .eq('nam', nam)
      .maybeSingle()
    setLoading(false)
    if (data) {
      setForm(
        Object.fromEntries(
          Object.keys(emptyForm).map((k) => [k, data[k] != null ? String(data[k]) : ''])
        ) as FormData
      )
    } else {
      setForm(emptyForm)
    }
  }, [user, thang, nam])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const payload = {
      username: user!.username,
      fullname: user!.fullname,
      thang,
      nam,
      ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, toNum(v)])),
    }
    const { error } = await supabase
      .from('hoat_dong_tram_of_thang')
      .upsert(payload, { onConflict: 'username,thang,nam' })
    setSaving(false)
    setMessage(
      error
        ? { type: 'error', text: 'Lưu thất bại: ' + error.message }
        : { type: 'success', text: 'Đã lưu thành công!' }
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={s.backBtn}>
          ← Trang chủ
        </button>
        <h2 style={s.headerTitle}>Báo cáo hoạt động trạm</h2>
        <span style={s.userLabel}>{user?.fullname || user?.username}</span>
      </div>

      <div style={s.content}>
        <div style={s.periodRow}>
          <span style={s.fullnameDisplay}>
            Người báo cáo: <strong>{user?.fullname || user?.username}</strong>
          </span>
          <span style={s.periodLabel}>Kỳ báo cáo:</span>
          <label style={s.selectLabel}>Tháng</label>
          <select value={thang} onChange={(e) => setThang(Number(e.target.value))} style={s.select}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label style={s.selectLabel}>Năm</label>
          <input
            type="number"
            value={nam}
            onChange={(e) => setNam(Number(e.target.value))}
            style={{ ...s.select, width: '80px' }}
            min={2000}
            max={2100}
          />
          {loading && <span style={s.loadingText}>Đang tải...</span>}
        </div>

        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '50px', textAlign: 'center' }}>STT</th>
                <th style={s.th}>Nội dung</th>
                <th style={{ ...s.th, width: '130px', textAlign: 'center' }}>Số liệu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={row.type === 'sub' ? s.subRow : undefined}>
                  <td style={s.tdStt}>
                    {row.type === 'main' ? row.stt : ''}
                  </td>
                  <td style={row.type === 'sub' ? s.tdLabelSub : s.tdLabel}>
                    {row.label}
                  </td>
                  <td style={s.tdInput}>
                    <input
                      type="number"
                      value={form[row.field]}
                      onChange={(e) => handleChange(row.field, e.target.value)}
                      style={s.input}
                      min={0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && (
          <p style={{ color: message.type === 'success' ? '#2e7d32' : '#d32f2f', margin: '0 0 0.8rem' }}>
            {message.text}
          </p>
        )}

        <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
          {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
        </button>
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
    gap: '1rem',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '0.3rem 0.8rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#333',
  },
  headerTitle: { margin: 0, fontSize: '1.1rem', flex: 1, color: '#1a1a2e' },
  userLabel: { fontSize: '0.875rem', color: '#666' },
  content: { padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' as const },
  periodRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1.2rem',
    background: '#fff',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    flexWrap: 'wrap',
  },
  fullnameDisplay: { width: '100%', fontSize: '0.9rem', color: '#333', paddingBottom: '0.4rem', borderBottom: '1px solid #eee', marginBottom: '0.2rem' },
  periodLabel: { fontWeight: 600, color: '#1a1a2e' },
  selectLabel: { fontSize: '0.9rem', color: '#555' },
  select: {
    padding: '0.3rem 0.5rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    color: '#1a1a2e',
    background: '#fff',
  },
  loadingText: { fontSize: '0.85rem', color: '#888' },
  tableWrapper: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '1rem',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: {
    background: '#1a73e8',
    color: '#fff',
    padding: '0.7rem 1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  tdStt: {
    padding: '0.5rem 0.8rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    borderBottom: '1px solid #f0f0f0',
    color: '#1a73e8',
    verticalAlign: 'middle',
  },
  tdLabel: {
    padding: '0.5rem 1rem',
    fontSize: '0.95rem',
    borderBottom: '1px solid #f0f0f0',
    color: '#1a1a2e',
    verticalAlign: 'middle',
    textAlign: 'left' as const,
  },
  tdLabelSub: {
    padding: '0.4rem 1rem 0.4rem 2.5rem',
    fontSize: '0.9rem',
    borderBottom: '1px solid #f0f0f0',
    color: '#555',
    fontStyle: 'italic',
    verticalAlign: 'middle',
    textAlign: 'left' as const,
  },
  tdInput: {
    padding: '0.35rem 0.8rem',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  },
  subRow: { background: '#fafafa' },
  input: {
    width: '100%',
    padding: '0.3rem 0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
    textAlign: 'right' as const,
    color: '#1a1a2e',
    background: '#fff',
    boxSizing: 'border-box' as const,
  },
  saveBtn: {
    padding: '0.7rem 2.5rem',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
