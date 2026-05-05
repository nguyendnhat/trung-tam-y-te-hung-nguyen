import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type FormData = {
  // I
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
  // II
  truyenthongsolanphatthanh: string
  truyenthongsolantructiep: string
  truyenthongsonguoithamgia: string
  // III
  duocvonthuochienco: string
  duocdoanhsomuavao: string
  duocdoanhsobanra: string
  duocsovonthatthoat: string
  thuoccacchuongtrinh: string
  // IV–XI
  noidungduytri: string
  congtackhac: string
  nhanxetketquadatduoc: string
  nhanxettontai: string
  trongtamthangtoi: string
  ykiendexuat: string
}

const emptyForm: FormData = {
  sogiuongbenhkehoach: '', solankham: '', solankhamtreduoi6tuoi: '',
  solankhamhongheo: '', solankhamcanngheo: '', solankhamyhct: '',
  solandieutringoaitru: '', solandieutrinoitru: '',
  solandieutrinoitrunguoingheo: '', solandieutrinoitrucanngheo: '',
  solandieutrinoitruyhct: '', songaydieutribinhquan: '',
  songaydieutrinoitru: '', congsuatsogiuongbenh: '',
  sobenhnhanngodoc: '', sobenhnhancapcuu: '', sobenhnhantainan: '',
  sobenhnhantainangiaothong: '', solanxetnghiem: '',
  solandetrongvung: '', solandetaitramofvung: '',
  sotresosinhsong: '', sotuvongtrongthang: '',
  truyenthongsolanphatthanh: '', truyenthongsolantructiep: '',
  truyenthongsonguoithamgia: '',
  duocvonthuochienco: '', duocdoanhsomuavao: '',
  duocdoanhsobanra: '', duocsovonthatthoat: '',
  thuoccacchuongtrinh: '', noidungduytri: '', congtackhac: '',
  nhanxetketquadatduoc: '', nhanxettontai: '',
  trongtamthangtoi: '', ykiendexuat: '',
}

const textFields = new Set([
  'thuoccacchuongtrinh', 'noidungduytri', 'congtackhac',
  'nhanxetketquadatduoc', 'nhanxettontai', 'trongtamthangtoi', 'ykiendexuat',
])

type RowDef =
  | { type: 'section'; label: string }
  | { type: 'main'; stt: number; label: string; field: keyof FormData; inputType?: 'textarea' }
  | { type: 'sub'; label: string; field: keyof FormData; inputType?: 'textarea' }
  | { type: 'nofield'; stt: number; label: string }
  | { type: 'textarea'; field: keyof FormData }

const rows: RowDef[] = [
  { type: 'section', label: 'I. Công tác khám chữa bệnh tại trạm y tế' },
  { type: 'main', stt: 1,  label: 'Giường bệnh kế hoạch',                              field: 'sogiuongbenhkehoach' },
  { type: 'main', stt: 2,  label: 'Tổng số lần khám bệnh',                              field: 'solankham' },
  { type: 'sub',           label: 'Trong đó trẻ < 6 tuổi',                              field: 'solankhamtreduoi6tuoi' },
  { type: 'sub',           label: 'Người nghèo',                                         field: 'solankhamhongheo' },
  { type: 'sub',           label: 'Cận nghèo',                                           field: 'solankhamcanngheo' },
  { type: 'sub',           label: 'Số B/n KCB bằng YHCT',                               field: 'solankhamyhct' },
  { type: 'main', stt: 3,  label: 'Số B/n điều trị ngoại trú',                          field: 'solandieutringoaitru' },
  { type: 'main', stt: 4,  label: 'Số B/n điều trị nội trú',                            field: 'solandieutrinoitru' },
  { type: 'sub',           label: 'Người nghèo',                                         field: 'solandieutrinoitrunguoingheo' },
  { type: 'sub',           label: 'Cận nghèo',                                           field: 'solandieutrinoitrucanngheo' },
  { type: 'sub',           label: 'Số B/n KCB bằng YHCT',                               field: 'solandieutrinoitruyhct' },
  { type: 'main', stt: 5,  label: 'Ngày điều trị trung bình',                           field: 'songaydieutribinhquan' },
  { type: 'main', stt: 6,  label: 'Tổng số ngày điều trị nội trú',                      field: 'songaydieutrinoitru' },
  { type: 'main', stt: 7,  label: 'Công suất SD giường bệnh tính theo GB KH (%)',       field: 'congsuatsogiuongbenh' },
  { type: 'main', stt: 8,  label: 'Số BN ngộ độc',                                      field: 'sobenhnhanngodoc' },
  { type: 'main', stt: 9,  label: 'Số bệnh nhân cấp cứu',                               field: 'sobenhnhancapcuu' },
  { type: 'main', stt: 10, label: 'Số bệnh nhân tai nạn',                               field: 'sobenhnhantainan' },
  { type: 'sub',           label: 'Trong đó: TNGT',                                      field: 'sobenhnhantainangiaothong' },
  { type: 'main', stt: 11, label: 'Số lần xét nghiệm',                                  field: 'solanxetnghiem' },
  { type: 'main', stt: 12, label: 'Tổng số đẻ trong xã, thị trấn',                     field: 'solandetrongvung' },
  { type: 'sub',           label: 'Trong đó: Đẻ tại Trạm Y tế xã, Thị trấn',           field: 'solandetaitramofvung' },
  { type: 'main', stt: 13, label: 'Số trẻ sơ sinh sống',                                field: 'sotresosinhsong' },
  { type: 'main', stt: 14, label: 'Số tử vong trong tháng',                             field: 'sotuvongtrongthang' },

  { type: 'section', label: 'II. Công tác truyền thông GDSK tại cộng đồng' },
  { type: 'main', stt: 1, label: 'Số lần phát thanh trên loa đài xã',                   field: 'truyenthongsolanphatthanh' },
  { type: 'main', stt: 2, label: 'Số buổi truyền thông trực tiếp',                      field: 'truyenthongsolantructiep' },
  { type: 'main', stt: 3, label: 'Số người tham dự',                                    field: 'truyenthongsonguoithamgia' },

  { type: 'section', label: 'III. Công tác dược' },
  { type: 'nofield', stt: 1, label: 'Chương trình thuốc thiết yếu:' },
  { type: 'sub', label: 'Vốn thuốc hiện có (Đồng)',                                      field: 'duocvonthuochienco' },
  { type: 'sub', label: 'Doanh số mua vào',                                              field: 'duocdoanhsomuavao' },
  { type: 'sub', label: 'Doanh số bán ra',                                               field: 'duocdoanhsobanra' },
  { type: 'sub', label: 'Số vốn thất thoát',                                             field: 'duocsovonthatthoat' },
  { type: 'main', stt: 2, label: 'Thuốc các chương trình:',  field: 'thuoccacchuongtrinh', inputType: 'textarea' },

  { type: 'section', label: 'IV. Nội dung duy trì xã đạt Bộ tiêu chí QG về Y tế và triển khai các đề án, dự án của nghành' },
  { type: 'textarea', field: 'noidungduytri' },

  { type: 'section', label: 'V. Công tác khác' },
  { type: 'textarea', field: 'congtackhac' },

  { type: 'section', label: 'VI. Nhận xét kết quả đạt được trong tháng' },
  { type: 'textarea', field: 'nhanxetketquadatduoc' },

  { type: 'section', label: 'VII. Những tồn tại' },
  { type: 'textarea', field: 'nhanxettontai' },

  { type: 'section', label: 'VIII. Những công tác trọng tâm tháng tới' },
  { type: 'textarea', field: 'trongtamthangtoi' },

  { type: 'section', label: 'XI. Ý kiến đề xuất' },
  { type: 'textarea', field: 'ykiendexuat' },
]

const now = new Date()
const defaultThang = now.getMonth() === 0 ? 12 : now.getMonth()
const defaultNam = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
const toNum = (val: string) => (val === '' ? null : Number(val))

export function BaoCaoHoatDongTram() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [thang, setThang] = useState(defaultThang)
  const [nam, setNam] = useState(defaultNam)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef<() => Promise<void>>(async () => {})

  const fetchData = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
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
    setDirty(false)
    setDirtyFields(new Set())
    setSavedFields(new Set())
    if (data) {
      setLocked(data.lockedit === true)
      setForm(
        Object.fromEntries(
          Object.keys(emptyForm).map((k) => [k, data[k] != null ? String(data[k]) : ''])
        ) as FormData
      )
    } else {
      setLocked(false)
      setForm(emptyForm)
    }
  }, [user, thang, nam])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setDirtyFields((prev) => new Set([...prev, field]))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const payload = {
      username: user!.username,
      fullname: user!.fullname,
      thang,
      nam,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) =>
          [k, textFields.has(k) ? (v || null) : toNum(v)]
        )
      ),
    }
    const { error } = await supabase
      .from('hoat_dong_tram_of_thang')
      .upsert(payload, { onConflict: 'username,thang,nam' })
    setSaving(false)
    if (!error) {
      setDirty(false)
      setDirtyFields((pending) => {
        setSavedFields(new Set(pending))
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        flashTimerRef.current = setTimeout(() => setSavedFields(new Set()), 1500)
        return new Set()
      })
    }
    setMessage(
      error
        ? { type: 'error', text: 'Lưu thất bại: ' + error.message }
        : { type: 'success', text: 'Đã lưu thành công!' }
    )
  }

  saveRef.current = handleSave

  // Auto-save 1.5s after user stops editing
  useEffect(() => {
    if (!dirty || locked) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { saveRef.current() }, 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [form, dirty, locked]) // eslint-disable-line react-hooks/exhaustive-deps

  const fieldStyle = (field: string, base: React.CSSProperties, lockedStyle: React.CSSProperties) => {
    if (locked) return { ...base, ...lockedStyle }
    if (savedFields.has(field)) return { ...base, background: '#e8f5e9', borderColor: '#4caf50', transition: 'background 0.4s, border-color 0.4s' }
    if (dirtyFields.has(field)) return { ...base, background: '#fff8e1', borderColor: '#ffc107', transition: 'background 0.4s, border-color 0.4s' }
    return base
  }

  const renderInput = (field: keyof FormData, isTextarea?: boolean) => {
    if (isTextarea) {
      return (
        <textarea
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          style={fieldStyle(field, s.textarea, s.textareaLocked)}
          disabled={locked}
          rows={3}
        />
      )
    }
    return (
      <input
        type="number"
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        style={fieldStyle(field, s.input, s.inputLocked)}
        min={0}
        disabled={locked}
      />
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={s.backBtn}>← Trang chủ</button>
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
                <th style={{ ...s.th, width: '160px', textAlign: 'center' }}>Số liệu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (row.type === 'section') {
                  return (
                    <tr key={i}>
                      <td colSpan={3} style={s.sectionCell}>{row.label}</td>
                    </tr>
                  )
                }

                if (row.type === 'textarea') {
                  return (
                    <tr key={i}>
                      <td colSpan={3} style={s.textareaCell}>
                        {renderInput(row.field, true)}
                      </td>
                    </tr>
                  )
                }

                if (row.type === 'nofield') {
                  return (
                    <tr key={i}>
                      <td style={s.tdStt}>{row.stt}</td>
                      <td colSpan={2} style={s.tdLabel}>{row.label}</td>
                    </tr>
                  )
                }

                // main | sub
                const isMain = row.type === 'main'
                const isTextarea = row.inputType === 'textarea'

                if (isTextarea) {
                  return (
                    <>
                      <tr key={`${i}-label`}>
                        <td style={s.tdStt}>{row.type === 'main' ? row.stt : ''}</td>
                        <td colSpan={2} style={!isMain ? s.tdLabelSub : s.tdLabel}>{row.label}</td>
                      </tr>
                      <tr key={`${i}-input`}>
                        <td />
                        <td colSpan={2} style={s.textareaCell}>
                          {renderInput(row.field, true)}
                        </td>
                      </tr>
                    </>
                  )
                }

                return (
                  <tr key={i} style={!isMain ? s.subRow : undefined}>
                    <td style={s.tdStt}>{row.type === 'main' ? row.stt : ''}</td>
                    <td style={!isMain ? s.tdLabelSub : s.tdLabel}>{row.label}</td>
                    <td style={s.tdInput}>
                      {renderInput(row.field, false)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {locked && <p style={s.lockedMsg}>Báo cáo kỳ này đã bị khóa, không thể chỉnh sửa.</p>}

        {message && (
          <p style={{ color: message.type === 'success' ? '#2e7d32' : '#d32f2f', margin: '0 0 0.8rem' }}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || locked}
          style={locked ? { ...s.saveBtn, ...s.saveBtnLocked } : s.saveBtn}
        >
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
  backBtn: { background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.875rem', color: '#333' },
  headerTitle: { margin: 0, fontSize: '1.1rem', flex: 1, color: '#1a1a2e' },
  userLabel: { fontSize: '0.875rem', color: '#666' },
  content: { padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' as const },
  periodRow: {
    display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem',
    background: '#fff', padding: '0.8rem 1rem', borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexWrap: 'wrap',
  },
  fullnameDisplay: { width: '100%', fontSize: '0.9rem', color: '#333', paddingBottom: '0.4rem', borderBottom: '1px solid #eee', marginBottom: '0.2rem' },
  periodLabel: { fontWeight: 600, color: '#1a1a2e' },
  selectLabel: { fontSize: '0.9rem', color: '#555' },
  select: { padding: '0.3rem 0.5rem', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.95rem', color: '#1a1a2e', background: '#fff' },
  loadingText: { fontSize: '0.85rem', color: '#888' },
  tableWrapper: { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { background: '#1a73e8', color: '#fff', padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600 },
  sectionCell: {
    padding: '0.55rem 1rem', background: '#e8f0fe', color: '#1a1a2e',
    fontWeight: 700, fontSize: '0.9rem', borderBottom: '1px solid #c5d8fb',
    textAlign: 'left' as const,
  },
  tdStt: { padding: '0.5rem 0.8rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #f0f0f0', color: '#1a73e8', verticalAlign: 'middle' },
  tdLabel: { padding: '0.5rem 1rem', fontSize: '0.95rem', borderBottom: '1px solid #f0f0f0', color: '#1a1a2e', verticalAlign: 'middle', textAlign: 'left' as const },
  tdLabelSub: { padding: '0.4rem 1rem 0.4rem 2.5rem', fontSize: '0.9rem', borderBottom: '1px solid #f0f0f0', color: '#555', fontStyle: 'italic', verticalAlign: 'middle', textAlign: 'left' as const },
  tdInput: { padding: '0.35rem 0.8rem', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  textareaCell: { padding: '0.5rem 1rem', borderBottom: '1px solid #f0f0f0' },
  subRow: { background: '#fafafa' },
  input: { width: '100%', padding: '0.3rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', textAlign: 'right' as const, color: '#1a1a2e', background: '#fff', boxSizing: 'border-box' as const },
  inputLocked: { background: '#f5f5f5', color: '#999', cursor: 'not-allowed', border: '1px solid #e0e0e0' },
  textarea: { width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', color: '#1a1a2e', background: '#fff', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  textareaLocked: { background: '#f5f5f5', color: '#999', cursor: 'not-allowed', border: '1px solid #e0e0e0' },
  lockedMsg: { margin: '0 0 0.8rem', padding: '0.6rem 1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '6px', color: '#e65100', fontSize: '0.9rem' },
  saveBtn: { padding: '0.7rem 2.5rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  saveBtnLocked: { background: '#bdbdbd', cursor: 'not-allowed' },
}
