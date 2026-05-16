import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import hanhChinhRaw from '../lib/quydoihanhchinh.json'

// ─── Địa giới hành chính ──────────────────────────────────────────────────────

interface HanhChinhRecord {
  CODE: string
  TinhCu: string
  HuyenCu: string
  XaCu: string
  ThonCu: string
  TinhMoi: string
  XaMoi: string
  ThonMoi: string
}

interface NewAddressResult {
  tinhCu: string
  huyenCu: string
  xaCu: string
  thonCu?: string
  tinhMoi?: string
  xaMoi?: string
  thonMoi?: string
  isConverted: boolean
}

const hanhChinhList = hanhChinhRaw as HanhChinhRecord[]

function norm(s: string): string {
  return s?.trim().toLowerCase()
}

function parseAddressParts(address: string) {
  const parts = address.split(',').map(p => p.trim()).filter(Boolean)
  const n = parts.length
  if (n < 3) return null
  return {
    tinh: parts[n - 1],
    huyen: parts[n - 2],
    xa: parts[n - 3],
    thon: n >= 4 ? parts[n - 4] : '',
  }
}

function lookupNewAddress(address: string | null): NewAddressResult | null {
  if (!address) return null
  const parsed = parseAddressParts(address)
  if (!parsed) return null

  const base = {
    tinhCu: parsed.tinh,
    huyenCu: parsed.huyen,
    xaCu: parsed.xa,
    thonCu: parsed.thon || undefined,
  }

  // Cách 1: Tìm theo TinhCu + HuyenCu + XaCu + ThonCu
  if (parsed.thon) {
    const m = hanhChinhList.find(r =>
      norm(r.TinhCu) === norm(parsed.tinh) &&
      norm(r.HuyenCu) === norm(parsed.huyen) &&
      norm(r.XaCu) === norm(parsed.xa) &&
      norm(r.ThonCu) === norm(parsed.thon)
    )
    if (m) return { ...base, tinhMoi: m.TinhMoi, xaMoi: m.XaMoi, thonMoi: m.ThonMoi, isConverted: true }
  }

  // Cách 2: Tìm theo TinhCu + HuyenCu + XaCu
  const m2 = hanhChinhList.find(r =>
    norm(r.TinhCu) === norm(parsed.tinh) &&
    norm(r.HuyenCu) === norm(parsed.huyen) &&
    norm(r.XaCu) === norm(parsed.xa)
  )
  if (m2) return { ...base, tinhMoi: m2.TinhMoi, xaMoi: m2.XaMoi, isConverted: true }

  return { ...base, isConverted: false }
}

// ─── Supabase record ──────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CccdPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<CccdRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records
    const q = searchQuery.trim().toLowerCase()
    return records.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.cccd_number.toLowerCase().includes(q) ||
      (r.address ?? '').toLowerCase().includes(q)
    )
  }, [records, searchQuery])

  useEffect(() => { fetchRecords() }, [])

  async function fetchRecords() {
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('cccd_data')
      .select('id, cccd_number, full_name, date_of_birth, gender, address, issue_date, created_at')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRecords(data ?? [])
    setIsLoading(false)
  }

  function copyField(recordId: string, fieldName: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(`${recordId}-${fieldName}`)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  function exportToExcel() {
    const rows = filteredRecords.map(r => {
      const addr = lookupNewAddress(r.address)
      const fullNew = addr?.tinhMoi && addr?.xaMoi
        ? [addr.thonCu, addr.xaMoi, addr.tinhMoi].filter(Boolean).join(', ')
        : ''
      return {
        'Họ tên': r.full_name.toUpperCase(),
        'Số CCCD': r.cccd_number,
        'Ngày sinh': r.date_of_birth,
        'Giới tính': r.gender,
        'Ngày cấp': r.issue_date ?? '',
        'Địa chỉ': r.address ?? '',
        'Thôn/Xóm cũ': addr?.thonCu ?? '',
        'Xã/Phường cũ': addr?.xaCu ?? '',
        'Huyện cũ': addr?.isConverted ? (addr.huyenCu ?? '') : '',
        'Tỉnh cũ': addr?.tinhCu ?? '',
        'Xã/Phường mới': addr?.xaMoi ?? '',
        'Tỉnh mới': addr?.tinhMoi ?? '',
        'Địa chỉ mới đầy đủ': fullNew,
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách')
    const fileName = searchQuery
      ? `danh-sach-benh-nhan-${searchQuery}.xlsx`
      : 'danh-sach-benh-nhan.xlsx'
    XLSX.writeFile(wb, fileName)
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
            <div style={s.searchBar}>
              <input
                style={s.searchInput}
                type="text"
                placeholder="Tìm theo tên, số CCCD, địa chỉ..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearchQuery(searchInput)}
              />
              <button style={s.searchBtn} onClick={() => setSearchQuery(searchInput)}>Tìm kiếm</button>
              {searchQuery && (
                <button style={s.clearBtn} onClick={() => { setSearchInput(''); setSearchQuery('') }}>✕</button>
              )}
              <button style={s.exportBtn} onClick={exportToExcel}>Xuất Excel</button>
            </div>
            {searchQuery && (
              <p style={s.hint}>
                {filteredRecords.length === 0
                  ? 'Không tìm thấy kết quả'
                  : `${filteredRecords.length} kết quả cho "${searchQuery}"`}
              </p>
            )}
            {!searchQuery && <p style={s.hint}>Click vào từng trường để copy</p>}
            <div style={s.list}>
              {filteredRecords.map(record => (
                <div key={record.id} style={s.card}>
                  {/* Tên */}
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

                  {/* Các trường cơ bản */}
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

                  {/* Địa giới hành chính mới */}
                  <NewAddressSection
                    address={record.address}
                    recordId={record.id}
                    copiedKey={copiedKey}
                    onCopy={copyField}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── NewAddressSection ────────────────────────────────────────────────────────

function NewAddressSection({
  address,
  recordId,
  copiedKey,
  onCopy,
}: {
  address: string | null
  recordId: string
  copiedKey: string | null
  onCopy: (id: string, field: string, value: string) => void
}) {
  const result = useMemo(() => lookupNewAddress(address), [address])
  if (!result) return null

  const fullNewAddress = result.tinhMoi && result.xaMoi
    ? [result.thonCu, result.xaMoi, result.tinhMoi].filter(Boolean).join(', ')
    : null

  return (
    <div style={s.newBlock}>
      <span style={s.newBlockTitle}>Địa chỉ gốc</span>
      <div style={s.fields}>
        {result.isConverted ? (
          <>
            {result.thonCu && (
              <CopyField
                label="Thôn/Xóm cũ"
                value={result.thonCu}
                isCopied={copiedKey === `${recordId}-thon-cu`}
                onClick={() => onCopy(recordId, 'thon-cu', result.thonCu!)}
              />
            )}
            <CopyField
              label="Xã/Phường cũ"
              value={result.xaCu}
              isCopied={copiedKey === `${recordId}-xa-cu`}
              onClick={() => onCopy(recordId, 'xa-cu', result.xaCu)}
            />
            <CopyField
              label="Huyện cũ"
              value={result.huyenCu}
              isCopied={copiedKey === `${recordId}-huyen-cu`}
              onClick={() => onCopy(recordId, 'huyen-cu', result.huyenCu)}
            />
          </>
        ) : (
          <>
            <CopyField
              label="Khối"
              value={result.xaCu}
              isCopied={copiedKey === `${recordId}-xa-cu`}
              onClick={() => onCopy(recordId, 'xa-cu', result.xaCu)}
            />
            <CopyField
              label="Phường"
              value={result.huyenCu}
              isCopied={copiedKey === `${recordId}-huyen-cu`}
              onClick={() => onCopy(recordId, 'huyen-cu', result.huyenCu)}
            />
          </>
        )}
        <CopyField
          label="Tỉnh cũ"
          value={result.tinhCu}
          isCopied={copiedKey === `${recordId}-tinh-cu`}
          onClick={() => onCopy(recordId, 'tinh-cu', result.tinhCu)}
        />
      </div>
      {result.tinhMoi && result.xaMoi && (
        <>
          <span style={s.newBlockTitle}>Địa giới hành chính mới</span>
          <div style={s.fields}>
            {result.thonMoi && (
              <CopyField
                label="Thôn/Xóm mới"
                value={result.thonMoi}
                isCopied={copiedKey === `${recordId}-thon-moi`}
                onClick={() => onCopy(recordId, 'thon-moi', result.thonMoi!)}
              />
            )}
            <CopyField
              label="Xã/Phường mới"
              value={result.xaMoi}
              isCopied={copiedKey === `${recordId}-xa-moi`}
              onClick={() => onCopy(recordId, 'xa-moi', result.xaMoi!)}
            />
            <CopyField
              label="Tỉnh mới"
              value={result.tinhMoi}
              isCopied={copiedKey === `${recordId}-tinh-moi`}
              onClick={() => onCopy(recordId, 'tinh-moi', result.tinhMoi!)}
            />
            {fullNewAddress && (
              <CopyField
                label="Địa chỉ mới đầy đủ"
                value={fullNewAddress}
                isCopied={copiedKey === `${recordId}-full-moi`}
                onClick={() => onCopy(recordId, 'full-moi', fullNewAddress)}
                wide
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── CopyField ────────────────────────────────────────────────────────────────

function CopyField({
  label, value, isCopied, onClick, wide = false,
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' },
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
    padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none',
    background: '#1a73e8', color: '#fff', cursor: 'pointer', fontSize: '0.875rem',
  },
  searchBar: {
    display: 'flex', gap: '0.5rem', maxWidth: '760px', margin: '0 auto 0.75rem',
  },
  searchInput: {
    flex: 1, padding: '0.5rem 0.85rem', borderRadius: '8px',
    border: '1px solid #ccc', fontSize: '0.9rem', outline: 'none',
  },
  searchBtn: {
    padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none',
    background: '#1a73e8', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  clearBtn: {
    padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc',
    background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#666',
  },
  exportBtn: {
    padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none',
    background: '#2e7d32', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '760px', margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e8e8e8',
    display: 'flex', flexDirection: 'column', gap: '0.65rem',
  },
  name: { fontWeight: 800, fontSize: '1.15rem', color: '#1a1a2e', letterSpacing: '0.02em' },
  nameCopied: { fontSize: '0.8rem', color: '#1a73e8', fontWeight: 700, marginLeft: '0.5rem' },
  fields: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  field: {
    display: 'flex', flexDirection: 'column', gap: '0.15rem',
    padding: '0.5rem 0.75rem', borderRadius: '8px',
    border: '1px solid #eee', background: '#fafafa',
    cursor: 'pointer', minWidth: '130px',
    transition: 'border-color 0.15s, background 0.15s',
  },
  fieldWide: { flex: '1 1 100%' },
  fieldCopied: { borderColor: '#1a73e8', background: '#e8f0fe' },
  fieldLabel: {
    fontSize: '0.72rem', color: '#888', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  fieldValue: { fontSize: '1rem', color: '#1a1a2e', fontWeight: 600 },
  copiedMark: { fontSize: '0.72rem', color: '#1a73e8', fontWeight: 700, marginTop: '0.1rem' },
  newBlock: {
    background: '#f3e8ff', border: '1px solid #d8b4fe',
    borderRadius: '10px', padding: '0.65rem 0.85rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  newBlockTitle: { fontSize: '0.78rem', color: '#7b1fa2', fontWeight: 700 },
}
