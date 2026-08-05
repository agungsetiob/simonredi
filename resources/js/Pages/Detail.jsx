import React, { useState, useEffect, useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { formatDate } from '@/Utils/date';
import { Mars, Venus, SendHorizonal, Loader2, X } from 'lucide-react';

export default function Detail({ no_rawat }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pasien, setPasien] = useState({});
    const [keluhan, setKeluhan] = useState(null);
    const [cppt, setCppt] = useState({});
    const [diagnosa, setDiagnosa] = useState(null);
    const [kelengkapan, setKelengkapan] = useState({ fields: {}, missing: [], pct: 0, total: 0 });
    const [opsional, setOpsional] = useState({});
    const [isBpjs, setIsBpjs] = useState(false);
    const [noSep, setNoSep] = useState(null);
    const [berkas, setBerkas] = useState([]);
    const [jmlDokumen, setJmlDokumen] = useState(0);
    const [jmlTte, setJmlTte] = useState(0);
    const [tteLengkap, setTteLengkap] = useState(false);

    // State untuk catatan
    const [noteText, setNoteText] = useState('');
    const [notes, setNotes] = useState([]);
    const [sending, setSending] = useState(false);

    // State untuk modal
    const [modal, setModal] = useState({
        open: false,
        title: '',
        message: '',
        type: 'info', // 'info' | 'success' | 'error'
    });

    const showModal = (title, message, type = 'info') => {
        setModal({ open: true, title, message, type });
    };

    const closeModal = () => {
        setModal({ open: false, title: '', message: '', type: 'info' });
    };

    // ... (inisial, statusBadgeClass, dll tetap sama, tidak diubah)
    const inisial = useMemo(() => {
        const nama = pasien.nama_pasien || '';
        return nama.split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase();
    }, [pasien.nama_pasien]);

    const statusBadgeClass = useMemo(() => {
        const s = kelengkapan.status;
        if (s === 'done') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (s === 'empty') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }, [kelengkapan.status]);

    const statusBadgeText = useMemo(() => {
        const s = kelengkapan.status;
        if (s === 'done') return '✓ Lengkap';
        if (s === 'empty') return '✗ Kosong';
        return 'Belum Lengkap';
    }, [kelengkapan.status]);

    const pctColor = (pct) => {
        if (pct === 100) return '#16a34a';
        if (pct === 0) return '#dc2626';
        return '#d97706';
    };

    const DOK_WAJIB_POLI = ['LAPORAN INDIVIDUAL','SEP','RINCIAN TAGIHAN','RESUME MEDIS'];
    const DOK_WAJIB_IGD = ['LAPORAN INDIVIDUAL','SEP','RINCIAN TAGIHAN','TRIAGE IGD (TTE)','RESUME MEDIS','PENGKAJIAN AWAL'];

    const dokumenWajib = useMemo(() => {
        if (!isBpjs) return [];
        const isIGD = (pasien.nama_poli || '').toUpperCase().includes('UGD') || (pasien.nama_poli || '').toUpperCase().includes('IGD');
        const daftar = isIGD ? DOK_WAJIB_IGD : DOK_WAJIB_POLI;
        const normalize = (str) => (str || '').toUpperCase().replace(/_/g,' ').replace(/\s*\d{6,}\S*/g,'').trim();
        return daftar.map(dw => {
            const keyword = dw.replace(' (TTE)', '').replace(/-/g,' ').trim();
            const found = berkas.find(d => normalize(d.nama_dokumen || '').includes(keyword));
            return {
                nama: dw,
                ada: !!found,
                sudah_tte: found ? !!found.sudah_tte : false,
                tte_oleh: found ? (found.tte_oleh || '-') : '-'
            };
        });
    }, [isBpjs, pasien.nama_poli, berkas]);

    const tteWajibAda = useMemo(() => dokumenWajib.filter(d => d.ada).length, [dokumenWajib]);
    const tteWajibTotal = useMemo(() => dokumenWajib.length, [dokumenWajib]);
    const pctTTE = useMemo(() => {
        const total = tteWajibTotal;
        return total > 0 ? Math.round((tteWajibAda / total) * 100) : 0;
    }, [tteWajibAda, tteWajibTotal]);

    const tteBadgeClass = useMemo(() => {
        const p = pctTTE;
        if (p === 100) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        if (p === 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }, [pctTTE]);

    const tteBadgeText = useMemo(() => {
        const p = pctTTE;
        if (p === 100) return '✓ TTE Lengkap';
        if (p === 0) return '✗ Belum TTE';
        return `⚠ TTE Sebagian (${tteWajibAda}/${tteWajibTotal})`;
    }, [pctTTE, tteWajibAda, tteWajibTotal]);

    // Load data pasien
    useEffect(() => {
        setLoading(true);
        axios.get('/api/pasien-detail', {
            params: { no_rawat }
        }).then(res => {
            if (res.data.success) {
                const data = res.data;
                setPasien(data.pasien || {});
                setKeluhan(data.keluhan ? data.keluhan.keluhan : null);
                setCppt(data.cppt || {});
                setDiagnosa(data.diagnosa ? (data.diagnosa.DIAGNOSA || data.diagnosa.KODE || null) : null);
                setKelengkapan(data.kelengkapan || { fields: {}, missing: [], pct: 0, total: 0 });
                setOpsional(data.opsional || {});
                setIsBpjs(data.is_bpjs || false);
                setNoSep(data.no_sep || null);
                setBerkas(data.berkas || []);
                setJmlDokumen(data.jml_dokumen || 0);
                setJmlTte(data.jml_tte || 0);
                setTteLengkap(data.tte_lengkap || false);
                loadNotes();
            } else {
                setError(data.error || 'Gagal memuat data');
                showModal('Gagal', data.error || 'Gagal memuat data', 'error');
            }
        }).catch(err => {
            const msg = 'Gagal memuat data. Cek koneksi server.';
            setError(msg);
            showModal('Error', msg, 'error');
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    }, [no_rawat]);

    // Fungsi strip HTML
    function stripHtml(html) {
        if (!html) return '—';
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?[^>]+(>|$)/g, "");
    }

    // Load catatan
    const loadNotes = () => {
        axios.get('/api/rme-notes', {
            params: { no_kunjungan: no_rawat }
        }).then(res => {
            if (res.data.success) {
                setNotes(res.data.data);
            }
        }).catch(err => console.error(err));
    };

    const handleSendNote = () => {
        if (!noteText.trim()) {
            showModal('Peringatan', 'Catatan tidak boleh kosong.', 'error');
            return;
        }

        setSending(true);
        axios.post('/api/rme-notes', {
            no_kunjungan: no_rawat,
            catatan: noteText
        }).then(res => {
            const data = res.data;
            if (data.success) {
                setNoteText('');
                loadNotes();
                let title = 'Berhasil';
                let message = data.message;
                let type = 'success';
                if (data.wa_status === 'gagal') {
                    type = 'error';
                    title = 'Catatan Tersimpan, WA Gagal';
                } else if (data.wa_status === 'no_contact') {
                    type = 'info';
                    title = 'Catatan Tersimpan, Tanpa WA';
                }
                showModal(title, message, type);
            } else {
                showModal('Gagal', data.message || 'Gagal menyimpan catatan.', 'error');
            }
        }).catch(err => {
            const msg = err.response?.data?.message || 'Terjadi kesalahan saat mengirim.';
            showModal('Error', msg, 'error');
            console.error(err);
        }).finally(() => {
            setSending(false);
        });
    };

    const [resendingId, setResendingId] = useState(null);

    const handleResend = (noteId) => {
        setResendingId(noteId);
        axios.post(`/api/rme-notes/resend/${noteId}`)
            .then(res => {
                if (res.data.success) {
                    showModal('Berhasil', res.data.message, 'success');
                    loadNotes(); // refresh
                } else {
                    showModal('Gagal', res.data.message, 'error');
                }
            })
            .catch(err => {
                showModal('Error', 'Terjadi kesalahan saat mengirim ulang.', 'error');
                console.error(err);
            })
            .finally(() => setResendingId(null));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Detail Rekam Medis {pasien.nama_pasien && `- ${pasien.nama_pasien}`}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('dashboard')} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            ← Kembali
                        </Link>
                        <button onClick={() => window.print()} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            🖨 Cetak
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Detail Rekam Medis" />
            <div className="py-6">
                <div className="max-w-8xl mx-auto sm:px-6 lg:px-8">
                    {loading && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                            Memuat data pasien...
                        </div>
                    )}
                    {error && !loading && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 text-center text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <>
                            {/* Card pasien - tetap sama */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xl flex-shrink-0">
                                        {inisial}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between">
                                            <div>
                                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    {pasien.nama_pasien || '-'}
                                                    {pasien.jenis_kelamin == 1 && <Mars className="w-5 h-5 text-blue-600 dark:text-blue-300" />}
                                                    {pasien.jenis_kelamin == 2 && <Venus className="w-5 h-5 text-pink-600 dark:text-pink-300" />}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">No. RM: {pasien.no_rm || '-'}</div>
                                            </div>
                                            <div className="flex gap-2 mt-2 sm:mt-0">
                                                {isBpjs && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">BPJS</span>
                                                )}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                                                    {statusBadgeText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Poli / Ruangan:</span> {pasien.nama_poli || '-'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Dokter DPJP:</span> {pasien.nama_dokter || '-'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Tanggal masuk:</span> {formatDate(pasien.waktu_masuk)}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Kontak Dokter:</span> {pasien.kontak_dokter || '-'}</div>
                                    {isBpjs && (
                                        <div className="md:col-span-2 dark:text-white"><span className="text-gray-500 dark:text-gray-300">No. SEP:</span> <span className="font-mono">{noSep || '-'}</span></div>
                                    )}
                                </div>
                            </div>

                            {/* Alert missing - tetap sama */}
                            {kelengkapan.missing && kelengkapan.missing.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                                Field belum terisi: <strong>{kelengkapan.missing.join(', ')}</strong>. Segera lengkapi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Statistik - tetap sama */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
                                    <div className="text-2xl font-bold" style={{ color: pctColor(kelengkapan.pct) }}>{kelengkapan.pct || 0}%</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Kelengkapan RM</div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                                        <div className="h-full rounded" style={{ width: kelengkapan.pct+'%', backgroundColor: pctColor(kelengkapan.pct) }}></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
                                    <div className="text-2xl font-bold" style={{ color: kelengkapan.missing && kelengkapan.missing.length ? '#dc2626' : '#16a34a' }}>{kelengkapan.missing ? kelengkapan.missing.length : 0}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Field belum terisi dari {kelengkapan.total || 0}</div>
                                </div>
                                {isBpjs && (
                                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
                                        <div className="text-2xl font-bold" style={{ color: pctTTE === 100 ? '#6d28d9' : pctTTE === 0 ? '#dc2626' : '#d97706' }}>{pctTTE}%</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Kelengkapan TTE ({tteWajibAda}/{tteWajibTotal} dok wajib)</div>
                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                                            <div className="h-full rounded" style={{ width: pctTTE+'%', backgroundColor: pctTTE === 100 ? '#6d28d9' : pctTTE === 0 ? '#dc2626' : '#d97706' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Field kelengkapan - tetap sama */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Status pengisian per field</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {Object.entries(kelengkapan.fields || {}).map(([name, isi]) => (
                                        <div key={name} className={`flex items-center justify-between p-3 rounded-lg border ${isi ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                            <span className={`font-medium ${isi ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{name}</span>
                                            <span className="text-lg">{isi ? '✓' : '✗'}</span>
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(opsional).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Field Tambahan (Opsional)</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {Object.entries(opsional).map(([name, isi]) => (
                                                <div key={name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700" style={{ background: isi ? '#f0fdf4' : '#f8fafc', borderColor: isi ? '#86efac' : '#e2e8f0' }}>
                                                    <span style={{ color: isi ? '#15803d' : '#94a3b8' }}>{name}</span>
                                                    <span className="text-lg">{isi ? '✓' : '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data CPPT - tetap sama */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Data yang sudah tercatat</h3>
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Keluhan utama:</span> {keluhan || '-'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Subyektif (S):</span> {stripHtml(cppt.SUBYEKTIF) || '_'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Obyektif (O):</span> {cppt.OBYEKTIF || '—'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Assesment (A):</span> {stripHtml(cppt.ASSESMENT) || '—'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Planning (P):</span> {cppt.PLANNING || '—'}</div>
                                    <div className="dark:text-white"><span className="text-gray-500 dark:text-gray-300">Diagnosa:</span> {diagnosa || '—'}</div>
                                </div>
                            </div>

                            {/* Dokumen TTE - tetap sama */}
                            {isBpjs && (
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dokumen Berkas Klaim BPJS</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tteBadgeClass}`}>
                                            {tteBadgeText}
                                        </span>
                                    </div>
                                    {/* Checklist dokumen wajib */}
                                    <div className="mb-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {dokumenWajib.map(d => (
                                                <div key={d.nama} className={`flex items-center justify-between p-3 rounded-lg border ${d.ada ? (d.sudah_tte ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700') : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                                    <span className={`font-medium ${d.ada ? (d.sudah_tte ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300') : 'text-red-700 dark:text-red-300'}`}>{d.nama}</span>
                                                    {!d.ada && <span className="text-red-600 dark:text-red-400 text-sm">✗ Belum ada</span>}
                                                    {d.ada && d.sudah_tte && <span className="text-purple-600 dark:text-purple-400 text-sm">✓ TTE</span>}
                                                    {d.ada && !d.sudah_tte && <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠ Belum TTE</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Semua dokumen */}
                                    {berkas.length > 0 ? (
                                        <div>
                                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Semua Dokumen Terupload ({berkas.length})</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama Dokumen</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipe</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tgl Upload</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status TTE</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Upload Oleh</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {berkas.map(d => (
                                                            <tr key={d.nama_dokumen}>
                                                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100" title={d.nama_dokumen}>{d.nama_dokumen ? d.nama_dokumen.replace(/_/g,' ').replace(/\s*\d{6,}\S*/g,'').trim() : '-'}</td>
                                                                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">PDF</td>
                                                                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{d.tgl_upload ? d.tgl_upload.substring(0,10) : '-'}</td>
                                                                <td className="px-3 py-2"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓ Ada</span></td>
                                                                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{d.tte_oleh || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-500 dark:text-red-400 text-center py-4">Belum ada dokumen terupload.</p>
                                    )}
                                </div>
                            )}

                            {/* Catatan RME */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mt-6">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                    Catatan Kelengkapan RME
                                </h3>
                                
                                {/* Form kirim catatan dengan spinner */}
                                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Tulis catatan untuk dokter..."
                                        className="flex-1 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                        rows="2"
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={handleSendNote}
                                        disabled={sending || !noteText.trim()}
                                        className="inline-flex items-center px-1 py-1 bg-green-600 dark:bg-green-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            </>
                                        ) : (
                                            <>
                                                <SendHorizonal className="w-12 h-6" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {notes.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada catatan.</p>
                                    )}
                                    {notes.map((note) => (
                                        <div key={note.id} className="border-l-4 border-indigo-400 pl-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-r-md">
                                            <div className="flex flex-wrap justify-between items-start gap-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {note.user ? note.user.name : 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(note.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{note.catatan}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    note.status === 'terkirim' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    note.status === 'gagal' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {note.status === 'terkirim' && '✓ Terkirim'}
                                                    {note.status === 'gagal' && '✗ Gagal'}
                                                    {note.status === 'draft' && 'Draft'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    note.wa_status === 'terkirim' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    note.wa_status === 'gagal' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    note.wa_status === 'no_contact' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                                    note.wa_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {note.wa_status === 'terkirim' && 'WA ✅'}
                                                    {note.wa_status === 'gagal' && 'WA ❌'}
                                                    {note.wa_status === 'no_contact' && 'WA ⚠️'}
                                                    {note.wa_status === 'pending' && 'WA ⏳'}
                                                    {!note.wa_status && 'WA ⏳'}
                                                </span>
                                                {note.wa_status === 'gagal' && (
                                                    <button
                                                        onClick={() => handleResend(note.id)}
                                                        className="ml-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none disabled:opacity-50"
                                                        disabled={resendingId === note.id}
                                                    >
                                                        {resendingId === note.id ? 'Mengirim...' : 'Kirim ulang WA'}
                                                    </button>
                                                )}
                                                {note.dikirim_at && (
                                                    <span className="text-xs text-gray-400 ml-auto">
                                                        Dikirim: {new Date(note.dikirim_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Component */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        {/* Tombol close */}
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {/* Icon berdasarkan tipe */}
                        <div className="flex items-center gap-3 mb-4">
                            {modal.type === 'success' && (
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            {modal.type === 'error' && (
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                            )}
                            {modal.type === 'info' && (
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{modal.title}</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{modal.message}</p>
                        <button
                            onClick={closeModal}
                            className="w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}