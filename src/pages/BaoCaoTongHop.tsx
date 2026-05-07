import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── Cấu hình cột bảng tổng hợp ────────────────────────────────────────────
type Col = { label: string; field: string; isText?: boolean }

const columns: Col[] = [
  { label: 'Tên xã',        field: 'fullname',                         isText: true },
  { label: 'T số lần khám', field: 'solankham' },
  { label: '<6 tuổi',       field: 'solankhamtreduoi6tuoi' },
  { label: 'Người nghèo',   field: 'solankhamhongheo' },
  { label: 'Cận nghèo',     field: 'solankhamcanngheo' },
  { label: 'YHCT',          field: 'solankhamyhct' },
  { label: 'Ngoại trú',     field: 'solandieutringoaitru' },
  { label: 'Nội trú',       field: 'solandieutrinoitru' },
  { label: 'Người nghèo',   field: 'solandieutrinoitrunguoingheo' },
  { label: 'Cận nghèo',     field: 'solandieutrinoitrucanngheo' },
  { label: 'Ngộ độc',       field: 'sobenhnhanngodoc' },
  { label: 'Cấp cứu',       field: 'sobenhnhancapcuu' },
  { label: 'Tai nạn',       field: 'sobenhnhantainan' },
  { label: 'TNGT',          field: 'sobenhnhantainangiaothong' },
  { label: 'XN',            field: 'solanxetnghiem' },
  { label: 'T số đẻ',       field: 'solandetrongvung' },
  { label: 'Tại trạm',      field: 'solandetaitramofvung' },
  { label: 'SS sống',       field: 'sotresosinhsong' },
  { label: 'TV',            field: 'sotuvongtrongthang' },
]

const SELECT_FIELDS = ['username', ...columns.map(c => c.field)].join(', ')

// ─── Cấu hình hiển thị chi tiết (giống BaoCaoHoatDongTram, read-only) ───────
type DetailRow =
  | { type: 'section'; label: string }
  | { type: 'main'; stt: number; label: string; field: string }
  | { type: 'sub'; label: string; field: string }
  | { type: 'nofield'; stt: number; label: string }
  | { type: 'textarea'; field: string }
  | { type: 'main_textarea'; stt: number; label: string; field: string }

const detailRows: DetailRow[] = [
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
  { type: 'main_textarea', stt: 2, label: 'Thuốc các chương trình:',                     field: 'thuoccacchuongtrinh' },

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

// ─── Types ───────────────────────────────────────────────────────────────────
type DataRow = Record<string, string | number | boolean | null>

const now = new Date()

// ─── Modal chi tiết ──────────────────────────────────────────────────────────
function DetailModal({ data, thang, nam, onClose }: {
  data: DataRow
  thang: number
  nam: number
  onClose: () => void
}) {
  const [locked, setLocked] = useState(data.lockedit === true)
  const [lockLoading, setLockLoading] = useState(false)

  const val = (field: string) => {
    const v = data[field]
    return v != null && v !== '' ? String(v) : '—'
  }

  const handleLockToggle = async () => {
    setLockLoading(true)
    const newLocked = !locked
    await supabase
      .from('hoat_dong_tram_of_thang')
      .update({ lockedit: newLocked })
      .eq('username', String(data.username))
      .eq('thang', thang)
      .eq('nam', nam)
    setLockLoading(false)
    setLocked(newLocked)
  }

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={ms.header}>
          <div>
            <div style={ms.title}>Chi tiết báo cáo</div>
            <div style={ms.subtitle}>{data.fullname} — Tháng {thang}/{nam}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleLockToggle}
              disabled={lockLoading}
              style={{ padding: '0.35rem 1rem', background: locked ? '#e65100' : '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px', cursor: lockLoading ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: lockLoading ? 0.7 : 1 }}
            >
              {lockLoading ? '...' : locked ? 'Mở khóa' : 'Khóa nhập liệu'}
            </button>
            <button onClick={onClose} style={ms.closeBtn}>✕</button>
          </div>
        </div>

        {/* Modal body */}
        <div style={ms.body}>
          <table style={ms.table}>
            <thead>
              <tr>
                <th style={{ ...ms.th, width: '50px', textAlign: 'center' }}>STT</th>
                <th style={ms.th}>Nội dung</th>
                <th style={{ ...ms.th, width: '160px', textAlign: 'center' }}>Số liệu</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row, i) => {
                if (row.type === 'section') {
                  return (
                    <tr key={i}>
                      <td colSpan={3} style={ms.sectionCell}>{row.label}</td>
                    </tr>
                  )
                }
                if (row.type === 'textarea') {
                  return (
                    <tr key={i}>
                      <td colSpan={3} style={ms.textareaCell}>
                        <div style={ms.textVal}>{val(row.field)}</div>
                      </td>
                    </tr>
                  )
                }
                if (row.type === 'nofield') {
                  return (
                    <tr key={i}>
                      <td style={ms.tdStt}>{row.stt}</td>
                      <td colSpan={2} style={ms.tdLabel}>{row.label}</td>
                    </tr>
                  )
                }
                if (row.type === 'main_textarea') {
                  return (
                    <>
                      <tr key={`${i}-l`}>
                        <td style={ms.tdStt}>{row.stt}</td>
                        <td colSpan={2} style={ms.tdLabel}>{row.label}</td>
                      </tr>
                      <tr key={`${i}-v`}>
                        <td />
                        <td colSpan={2} style={ms.textareaCell}>
                          <div style={ms.textVal}>{val(row.field)}</div>
                        </td>
                      </tr>
                    </>
                  )
                }
                // main | sub
                const isMain = row.type === 'main'
                return (
                  <tr key={i} style={!isMain ? ms.subRow : undefined}>
                    <td style={ms.tdStt}>{isMain ? row.stt : ''}</td>
                    <td style={!isMain ? ms.tdLabelSub : ms.tdLabel}>{row.label}</td>
                    <td style={ms.tdValue}>{val(row.field)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Trang chính ─────────────────────────────────────────────────────────────
export function BaoCaoTongHop() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [rows, setRows] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; data: DataRow | null }>({ open: false, data: null })
  const [detailLoading, setDetailLoading] = useState(false)

  if (user?.username !== 'tonghop') {
    return <Navigate to="/" replace />
  }

  const handleLoad = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hoat_dong_tram_of_thang')
      .select(SELECT_FIELDS)
      .eq('thang', thang)
      .eq('nam', nam)
      .order('username')
    setLoading(false)
    setRows((data as unknown as DataRow[]) || [])
    setLoaded(true)
  }

  const handleDetail = async (row: DataRow) => {
    setDetailLoading(true)
    const { data } = await supabase
      .from('hoat_dong_tram_of_thang')
      .select('*')
      .eq('username', String(row.username))
      .eq('thang', thang)
      .eq('nam', nam)
      .maybeSingle()
    setDetailLoading(false)
    if (data) setModal({ open: true, data: data as DataRow })
  }

  const colTotal = (field: string) =>
    rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)

  const handleExportExcel = () => {
    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const strCell = (v: string) => `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`
    const numCell = (v: number) => `<Cell><Data ss:Type="Number">${v}</Data></Cell>`

    const headerRow = ['STT', ...columns.map(c => c.label)]
      .map(strCell).join('')

    const dataRows = rows.map((row, i) => {
      const cells = [strCell(String(i + 1))]
      columns.forEach(col => {
        const v = row[col.field]
        if (col.isText) cells.push(strCell(v != null ? String(v) : ''))
        else cells.push(numCell(Number(v) || 0))
      })
      return `<Row>${cells.join('')}</Row>`
    }).join('')

    const totalCells = [strCell('Tổng cộng')]
    columns.forEach((col, i) => {
      if (i === 0) totalCells.push(strCell(''))
      else totalCells.push(numCell(colTotal(col.field)))
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="BaoCao">
    <Table>
      <Row><Cell ss:MergeAcross="${headerRow.split('<Cell>').length - 2}"><Data ss:Type="String">Báo cáo tổng hợp - Tháng ${thang}/${nam}</Data></Cell></Row>
      <Row>${headerRow}</Row>
      ${dataRows}
      <Row>${totalCells.join('')}</Row>
    </Table>
  </Worksheet>
</Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bao-cao-tong-hop-thang-${thang}-${nam}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.875rem', color: '#333' }}>
          ← Trang chủ
        </button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1a2e', flex: 1 }}>Báo cáo tổng hợp</h2>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>{user?.fullname || user?.username}</span>
      </div>

      <div style={{ padding: '1.5rem 2rem' }}>
        {/* Card chọn kỳ */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '1.2rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const }}>
          <span style={{ fontWeight: 600, color: '#1a1a2e' }}>Kỳ báo cáo:</span>
          <label style={{ fontSize: '0.9rem', color: '#555' }}>Tháng</label>
          <select value={thang} onChange={e => setThang(Number(e.target.value))} style={{ padding: '0.35rem 0.6rem', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.95rem', color: '#1a1a2e' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <label style={{ fontSize: '0.9rem', color: '#555' }}>Năm</label>
          <input type="number" value={nam} onChange={e => setNam(Number(e.target.value))} style={{ padding: '0.35rem 0.5rem', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.95rem', width: '80px', color: '#1a1a2e' }} min={2000} max={2100} />
          <button onClick={handleLoad} disabled={loading} style={{ padding: '0.5rem 1.5rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
          {loaded && rows.length > 0 && (
            <button onClick={handleExportExcel} style={{ padding: '0.5rem 1.2rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
              Tải Excel
            </button>
          )}
          {detailLoading && <span style={{ fontSize: '0.85rem', color: '#888' }}>Đang tải chi tiết...</span>}
        </div>

        {/* Bảng dữ liệu */}
        {loaded && (
          rows.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              Không có dữ liệu cho kỳ báo cáo tháng {thang}/{nam}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#1a73e8', color: '#fff', padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.2)' }}>STT</th>
                    {columns.map(col => (
                      <th key={col.field} style={{ background: '#1a73e8', color: '#fff', padding: '0.6rem 0.8rem', textAlign: col.isText ? 'left' : 'center', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ background: '#1a73e8', color: '#fff', padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 600 }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                      <td style={{ padding: '0.45rem 0.8rem', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', textAlign: 'center', color: '#888' }}>{i + 1}</td>
                      {columns.map(col => (
                        <td key={col.field} style={{ padding: '0.45rem 0.8rem', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', textAlign: col.isText ? 'left' : 'center', color: '#1a1a2e' }}>
                          {row[col.field] != null ? String(row[col.field]) : ''}
                        </td>
                      ))}
                      <td style={{ padding: '0.35rem 0.6rem', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDetail(row)}
                          style={{ padding: '0.3rem 0.8rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Tổng cộng */}
                  <tr style={{ background: '#e8f0fe', fontWeight: 700 }}>
                    <td style={{ padding: '0.55rem 0.8rem', borderTop: '2px solid #1a73e8', textAlign: 'center' }} />
                    {columns.map((col, i) => (
                      <td key={col.field} style={{ padding: '0.55rem 0.8rem', borderTop: '2px solid #1a73e8', textAlign: col.isText ? 'left' : 'center', color: '#1a1a2e' }}>
                        {i === 0 ? 'Tổng cộng' : (colTotal(col.field) > 0 ? colTotal(col.field) : '')}
                      </td>
                    ))}
                    <td style={{ borderTop: '2px solid #1a73e8' }} />
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal chi tiết */}
      {modal.open && modal.data && (
        <DetailModal
          data={modal.data}
          thang={thang}
          nam={nam}
          onClose={() => setModal({ open: false, data: null })}
        />
      )}
    </div>
  )
}

// ─── Styles modal ─────────────────────────────────────────────────────────────
const ms: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' },
  modal: { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '860px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  header: { padding: '1rem 1.5rem', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' },
  subtitle: { fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' },
  closeBtn: { background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '1rem', color: '#333' },
  body: { overflowY: 'auto', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#1a73e8', color: '#fff', padding: '0.6rem 0.8rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 },
  sectionCell: { padding: '0.5rem 1rem', background: '#e8f0fe', color: '#1a1a2e', fontWeight: 700, fontSize: '0.875rem', borderBottom: '1px solid #c5d8fb', textAlign: 'left' as const },
  tdStt: { padding: '0.45rem 0.8rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #f0f0f0', color: '#1a73e8', verticalAlign: 'middle', width: '50px' },
  tdLabel: { padding: '0.45rem 1rem', fontSize: '0.9rem', borderBottom: '1px solid #f0f0f0', color: '#1a1a2e', verticalAlign: 'middle', textAlign: 'left' as const },
  tdLabelSub: { padding: '0.4rem 1rem 0.4rem 2.5rem', fontSize: '0.875rem', borderBottom: '1px solid #f0f0f0', color: '#555', fontStyle: 'italic', verticalAlign: 'middle', textAlign: 'left' as const },
  tdValue: { padding: '0.45rem 0.8rem', borderBottom: '1px solid #f0f0f0', textAlign: 'center', fontSize: '0.9rem', color: '#1a1a2e', verticalAlign: 'middle', fontWeight: 500, width: '160px' },
  textareaCell: { padding: '0.5rem 1rem', borderBottom: '1px solid #f0f0f0' },
  textVal: { fontSize: '0.9rem', color: '#1a1a2e', whiteSpace: 'pre-wrap', lineHeight: 1.5, minHeight: '2rem' },
  subRow: { background: '#fafafa' },
}
