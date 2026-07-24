import React, { useState, useEffect } from 'react'
import { Link, Head } from '@inertiajs/react'
import axios from 'axios'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  
  const [filterJenis, setFilterJenis] = useState('')

  const filters = [
    { key: 'all', label: 'Semua', activeClass: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' },
    { key: 'done', label: 'RM Lengkap', activeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
    { key: 'incomplete', label: 'RM Belum Lengkap', activeClass: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700' },
    { key: 'empty', label: 'RM Kosong', activeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700' },
    { key: 'tte', label: 'TTE Belum ✍️', activeClass: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700' }
  ]

  const jenisOptions = [
    { value: '', label: 'Semua Jenis' },
    { value: '1', label: 'Rawat Jalan' },
    { value: '2', label: 'Rawat Darurat' },
    { value: '3', label: 'Rawat Inap' }
  ]

  const stats = {
    total: allData.length,
    done: allData.filter(p => p.status === 'done').length,
    incomplete: allData.filter(p => p.status === 'incomplete').length,
    empty: allData.filter(p => p.status === 'empty').length,
    tte: allData.filter(p => p.is_bpjs && !p.tte_lengkap).length
  }

  const filteredData = allData.filter(p => {
    let matchFilter = true
    if (activeFilter === 'tte') matchFilter = p.is_bpjs && !p.tte_lengkap
    else if (activeFilter !== 'all') matchFilter = p.status === activeFilter
    
    // 🔹 PERBAIKAN: Menggunakan String() agar aman jika no_rm berupa angka
    const matchJenis = !filterJenis || String(p.jenis_kunjungan) === filterJenis
    
    const q = searchQuery.toLowerCase().trim()
    
    // 🔹 PERBAIKAN: Konversi no_rm ke string sebelum mencari
    const matchSearch = !q || 
                        p.nama.toLowerCase().includes(q) ||
                        String(p.no_rm).toLowerCase().includes(q) ||
                        (p.dokter || '').toLowerCase().includes(q)
                        
    return matchFilter && matchJenis && matchSearch
  })

  const tanggalFormatted = () => {
    const d = new Date(tanggal + 'T00:00:00')
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
  }

  const pctColor = (pct) => {
    if (pct === 100) return '#16a34a'
    if (pct === 0) return '#dc2626'
    return '#d97706'
  }

  const loadData = (force = false) => {
    setLoading(true)
    axios.get('/api/pasien-hari-ini', {
      params: { tgl: tanggal, refresh: force ? 1 : 0 }
    }).then(res => {
      if (res.data.success) {
        setAllData(res.data.data)
      } else {
        alert('Error: ' + res.data.error)
      }
    }).catch(err => {
      alert('Gagal memuat data. Cek koneksi server.')
      console.error(err)
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData(true)
  }, [tanggal])

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />
      <div className="py-6">
        <div className="max-w-8xl mx-auto sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total pasien</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">RM lengkap</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">RM belum lengkap</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.incomplete}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">RM kosong</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.empty}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">TTE belum lengkap</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.tte}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama pasien, no RM, atau dokter..."
                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 text-sm"
            />
            
            <select
              value={filterJenis}
              onChange={e => setFilterJenis(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 text-sm"
            >
              {jenisOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </button>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  activeFilter === filter.key
                    ? filter.activeClass
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{tanggalFormatted()}</span>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No. RM</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama pasien</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jenis</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Poli</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dokter DPJP</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jam</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Field belum terisi</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status RM</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" width="7%">TTE</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detail</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="11" className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">Memuat data...</td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">Tidak ada data yang sesuai.</td>
                    </tr>
                  ) : (
                    filteredData.map((p, idx) => (
                      <tr key={p.no_rawat}>
                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{idx+1}</td>
                        <td className="px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">{String(p.no_rm) || '-'}</td>
                        
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {p.is_bpjs && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">BPJS</span>}
                            <span className="font-medium text-gray-900 dark:text-gray-100">{p.nama}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                            <div className="h-full rounded" style={{ width: p.pct+'%', backgroundColor: pctColor(p.pct) }}></div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.pct}% terisi</div>
                        </td>
                        
                        <td className="px-3 py-2 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                            {p.jenis_kunjungan_label || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">{p.poli || '-'}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{p.dokter || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{p.jam || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {p.missing.map(m => (
                              <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{m}</span>
                            ))}
                            {p.missing.length === 0 && <span className="text-xs text-gray-400 dark:text-gray-500">—</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {p.status === 'done' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Lengkap</span>}
                          {p.status === 'empty' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Kosong</span>}
                          {p.status === 'incomplete' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Sebagian</span>}
                        </td>
                        <td className="px-3 py-2">
                          {!p.is_bpjs && <span className="text-xs text-gray-400 dark:text-gray-500">Non BPJS</span>}
                          {p.is_bpjs && p.jml_dokumen === 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Belum TTE</span>}
                          {p.is_bpjs && p.jml_dokumen > 0 && p.tte_lengkap && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">TTE Lengkap</span>}
                          {p.is_bpjs && p.jml_dokumen > 0 && !p.tte_lengkap && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">TTE {p.jml_tte}/{p.jml_dokumen}</span>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Link href={route('detail', { no_rawat: p.no_rawat })} className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            Lihat
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}