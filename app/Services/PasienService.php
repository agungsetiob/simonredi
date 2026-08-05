<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PasienService
{
    protected $fieldLabelsSemua;
    protected $fieldLabelsRalan;
    protected $fieldOpsional;

    public function __construct()
    {
        $this->fieldLabelsSemua = [
            'ada_diagnosa'         => 'Diagnosa',
            'ada_anamnesis'        => 'Keluhan Utama',
            'ada_status_fungsional' => 'Status Fungsional',
            'ada_skrining_gizi'    => 'Skrining Gizi',
            'ada_tanda_vital'      => 'Tanda Vital (CPPT)',
            'ada_edukasi'          => 'Edukasi Pasien',
            'ada_asuhan'           => 'Asuhan Keperawatan',
            'ada_cppt'             => 'CPPT',
            'ada_ttd'              => 'Verifikasi CPPT',
        ];

        $this->fieldLabelsRalan = [
            'ada_diagnosa'   => 'Diagnosa',
            'ada_anamnesis'  => 'Keluhan Utama',
            'ada_tanda_vital' => 'Tanda Vital (CPPT)',
            'ada_edukasi'    => 'Edukasi Pasien',
            'ada_cppt'       => 'CPPT',
            'ada_ttd'        => 'Verifikasi CPPT',
        ];

        $this->fieldOpsional = [
            'ada_riwayat'       => 'Riwayat Penyakit',
            'ada_nyeri'         => 'Penilaian Nyeri',
            'ada_faktor_risiko' => 'Faktor Risiko',
        ];
    }

    protected function getFieldLabels($namaPoli)
    {
        $poli = strtoupper($namaPoli ?? '');
        $isRalan = strpos($poli, 'POLI') !== false || strpos($poli, 'KLINIK') !== false;
        return $isRalan ? $this->fieldLabelsRalan : $this->fieldLabelsSemua;
    }

    protected function hitungKelengkapan($row, $fieldLabels)
    {
        $terisi = 0;
        $missing = [];
        $fields = [];
        foreach ($fieldLabels as $col => $label) {
            $isi = (int)($row->{$col} ?? 0) > 0;
            $fields[$label] = $isi;
            $isi ? $terisi++ : $missing[] = $label;
        }
        $total = count($fieldLabels);
        $pct = $total > 0 ? round(($terisi / $total) * 100) : 0;
        $status = $terisi === $total ? 'done' : ($terisi === 0 ? 'empty' : 'incomplete');
        return compact('fields', 'missing', 'terisi', 'total', 'pct', 'status');
    }

    protected function hitungOpsional($row)
    {
        $result = [];
        foreach ($this->fieldOpsional as $col => $label) {
            $result[$label] = (int)($row->{$col} ?? 0) > 0;
        }
        return $result;
    }

    public function getPasienHariIni($tanggal, $force = false)
    {
        $cacheKey = 'pasien_' . $tanggal;

        if ($force) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 300, function () use ($tanggal) {
            return $this->fetchPasienHariIni($tanggal);
        });
    }

    protected function fetchPasienHariIni($tanggal)
    {
        $sql = "
        SELECT
            k.NOMOR          AS no_kunjungan,
            k.NOPEN          AS nopen,
            k.MASUK          AS waktu_masuk,
            k.DPJP           AS dpjp_id,
            p.NORM           AS no_rm,
            p.NORM           AS norm_pasien,
            r.JENIS_KUNJUNGAN AS jenis_kunjungan,
            CASE
                WHEN r.JENIS_KUNJUNGAN=3 THEN 1
                WHEN r.JENIS_KUNJUNGAN=2 THEN 2
                ELSE 3
            END AS prioritas_ruangan,
            ps.NAMA          AS nama_pasien,
            ps.JENIS_KELAMIN AS jenis_kelamin,
            r.DESKRIPSI      AS nama_poli,
            
            (SELECT CONCAT(
                IFNULL(pg.GELAR_DEPAN, ''),
                IF(pg.GELAR_DEPAN IS NOT NULL AND pg.GELAR_DEPAN != '', ' ', ''),
                pg.NAMA,
                IF(pg.GELAR_BELAKANG IS NOT NULL AND pg.GELAR_BELAKANG != '', ', ', ''),
                IFNULL(pg.GELAR_BELAKANG, '')
            )
            FROM master.dokter_ruangan dr
            LEFT JOIN master.dokter d   ON dr.DOKTER = d.ID
            LEFT JOIN master.pegawai pg ON d.NIP = pg.NIP
            WHERE dr.DOKTER = k.DPJP AND dr.RUANGAN = k.RUANGAN
            LIMIT 1) AS nama_dokter,
            
            (SELECT pj.NOMOR
                FROM pendaftaran.penjamin pj
                JOIN pendaftaran.pendaftaran pp ON pp.NOMOR = pj.NOPEN
                WHERE pp.NORM = p.NORM AND pj.JENIS = 2
                AND DATE(pp.TANGGAL) = DATE(k.MASUK)
                ORDER BY pp.TANGGAL DESC LIMIT 1)                             AS no_sep,
            (SELECT COUNT(1)
                FROM berkas_klaim.berkas_detil bd
                JOIN pendaftaran.penjamin pj ON bd.NOMOR = pj.NOMOR
                JOIN pendaftaran.pendaftaran pp ON pp.NOMOR = pj.NOPEN
                WHERE pp.NORM = p.NORM AND pj.JENIS = 2
                AND DATE(pp.TANGGAL) = DATE(k.MASUK) LIMIT 1)                AS jml_tte,
            (SELECT COUNT(DISTINCT bd.NAMA_FILE)
                FROM berkas_klaim.berkas_detil bd
                JOIN pendaftaran.penjamin pj ON bd.NOMOR = pj.NOMOR
                JOIN pendaftaran.pendaftaran pp ON pp.NOMOR = pj.NOPEN
                WHERE pp.NORM = p.NORM AND pj.JENIS = 2
                AND DATE(pp.TANGGAL) = DATE(k.MASUK))                        AS jml_dokumen,
            (SELECT COUNT(1) FROM medicalrecord.diagnosa WHERE NOPEN = k.NOPEN LIMIT 1) AS ada_diagnosa,
            (SELECT COUNT(1) FROM medicalrecord.keluhan_utama WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_anamnesis,
            (SELECT COUNT(1) FROM medicalrecord.anamnesis WHERE KUNJUNGAN = k.NOMOR AND (RPS IS NOT NULL OR RPT IS NOT NULL) LIMIT 1) AS ada_riwayat,
            (SELECT COUNT(1) FROM medicalrecord.status_fungsional WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_status_fungsional,
            (SELECT COUNT(1) FROM medicalrecord.skrining_intervensi_dan_rekomendasi WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_skrining_gizi,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = k.NOMOR AND OBYEKTIF IS NOT NULL AND OBYEKTIF NOT IN ('','null','[]') LIMIT 1) AS ada_tanda_vital,
            (SELECT COUNT(1) FROM medicalrecord.penilaian_nyeri WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_nyeri,
            (SELECT COUNT(1) FROM medicalrecord.faktor_risiko WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_faktor_risiko,
            (SELECT COUNT(1) FROM medicalrecord.edukasi_pasien_keluarga WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_edukasi,
            (SELECT COUNT(1) FROM medicalrecord.asuhan_keperawatan WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_asuhan,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = k.NOMOR LIMIT 1) AS ada_cppt,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = k.NOMOR AND VERIFIKASI > 0 LIMIT 1) AS ada_ttd
        FROM pendaftaran.kunjungan k
        LEFT JOIN pendaftaran.pendaftaran p ON k.NOPEN   = p.NOMOR
        LEFT JOIN master.pasien ps          ON p.NORM    = ps.NORM
        LEFT JOIN master.ruangan r          ON k.RUANGAN = r.ID
        WHERE DATE(k.MASUK) = ?
          AND r.JENIS_KUNJUNGAN IN (1,2,3)
          AND r.DESKRIPSI NOT LIKE '%LAB%'
          AND r.DESKRIPSI NOT LIKE '%RAD%'
          AND r.DESKRIPSI NOT LIKE '%APOTEK%'
          AND r.DESKRIPSI NOT LIKE '%FARMASI%'
          AND r.DESKRIPSI NOT LIKE '%OPERASI%'
          AND r.DESKRIPSI NOT LIKE '%KSM%'
        ORDER BY p.NORM ASC,
                 CASE WHEN r.JENIS_KUNJUNGAN = 3 THEN 1 WHEN r.JENIS_KUNJUNGAN = 2 THEN 2 ELSE 3 END ASC,
                 k.MASUK ASC
    ";

        $rows = DB::connection('simrs')->select($sql, [$tanggal]);

        $hasil = [];
        $normTercatat = [];
        $no = 1;

        foreach ($rows as $r) {
            $jenisMap = [
                1 => 'Rawat Jalan',
                2 => 'Rawat Darurat',
                3 => 'Rawat Inap',
            ];
            $jenisLabel = $jenisMap[$r->jenis_kunjungan] ?? 'Lainnya';

            if (in_array($r->norm_pasien, $normTercatat)) continue;
            $normTercatat[] = $r->norm_pasien;

            $fl = $this->getFieldLabels($r->nama_poli);
            $k = $this->hitungKelengkapan($r, $fl);
            $ops = $this->hitungOpsional($r);

            $jmlTte = (int)($r->jml_tte ?? 0);
            $jmlDokumen = (int)($r->jml_dokumen ?? 0);

            $hasil[] = [
                'no'                   => $no++,
                'no_rawat'             => $r->no_kunjungan,
                'nopen'                => $r->nopen,
                'norm'                 => $r->norm_pasien,
                'no_rm'                => $r->no_rm ?? '-',
                'nama'                 => $r->nama_pasien ?? 'Tidak diketahui',
                'poli'                 => $r->nama_poli ?? '-',
                'dokter'               => $r->nama_dokter ?? '-',
                'jam'                  => $r->waktu_masuk ? substr($r->waktu_masuk, 11, 5) : '-',
                'pct'                  => $k['pct'],
                'status'               => $k['status'],
                'missing'              => $k['missing'],
                'terisi'               => $k['terisi'],
                'total'                => $k['total'],
                'opsional'             => $ops,
                'tte_lengkap'          => ($jmlDokumen > 0 && $jmlTte > 0),
                'jml_tte'              => $jmlTte,
                'jml_dokumen'          => $jmlDokumen,
                'no_sep'               => $r->no_sep ?? null,
                'is_bpjs'              => !empty($r->no_sep),
                'jenis_kunjungan'      => (int)$r->jenis_kunjungan,
                'jenis_kunjungan_label' => $jenisLabel,
                'prioritas_ruangan'    => (int)$r->prioritas_ruangan,
            ];
        }

        return [
            'success'   => true,
            'data'      => $hasil,
            'tanggal'   => $tanggal,
            'total'     => count($hasil),
            'cached_at' => now()->format('H:i:s'),
        ];
    }

    public function getDetailPasien($noKunjungan)
    {
        $sqlPasien = "
            SELECT
                k.NOMOR          AS no_kunjungan,
                k.NOPEN          AS nopen,
                k.MASUK          AS waktu_masuk,
                k.KELUAR         AS waktu_keluar,
                k.DPJP           AS dpjp_id,
                p.NORM           AS no_rm,
                p.TANGGAL        AS tgl_daftar,
                ps.NAMA          AS nama_pasien,
                ps.JENIS_KELAMIN AS jenis_kelamin,
                ps.TANGGAL_LAHIR AS tgl_lahir,
                r.DESKRIPSI      AS nama_poli,
                (SELECT CONCAT(
                    IFNULL(pg.GELAR_DEPAN, ''),
                    IF(pg.GELAR_DEPAN IS NOT NULL AND pg.GELAR_DEPAN != '', ' ', ''),
                    pg.NAMA,
                    IF(pg.GELAR_BELAKANG IS NOT NULL AND pg.GELAR_BELAKANG != '', ', ', ''),
                    IFNULL(pg.GELAR_BELAKANG, '')
                )
                FROM master.dokter_ruangan dr
                LEFT JOIN master.dokter d   ON dr.DOKTER = d.ID
                LEFT JOIN master.pegawai pg ON d.NIP = pg.NIP
                WHERE dr.DOKTER = k.DPJP AND dr.RUANGAN = k.RUANGAN
                LIMIT 1) AS nama_dokter,
                (SELECT kp.NOMOR
                FROM master.dokter_ruangan dr
                LEFT JOIN master.dokter d   ON dr.DOKTER = d.ID
                LEFT JOIN master.pegawai pg ON d.NIP = pg.NIP
                LEFT JOIN pegawai.kontak_pegawai kp ON pg.NIP = kp.NIP AND kp.JENIS = 3
                WHERE dr.DOKTER = k.DPJP AND dr.RUANGAN = k.RUANGAN AND kp.STATUS = 1
                LIMIT 1) AS kontak_dokter
            FROM pendaftaran.kunjungan k
            LEFT JOIN pendaftaran.pendaftaran p ON k.NOPEN   = p.NOMOR
            LEFT JOIN master.pasien ps          ON p.NORM    = ps.NORM
            LEFT JOIN master.ruangan r          ON k.RUANGAN = r.ID
            WHERE k.NOMOR = ?
            LIMIT 1
        ";

        $pasien = DB::connection('simrs')->selectOne($sqlPasien, [$noKunjungan]);

        if (!$pasien) {
            return ['success' => false, 'error' => 'Data tidak ditemukan'];
        }

        $nopen = $pasien->nopen;
        $noKunjungan = $pasien->no_kunjungan;

        $keluhan = DB::connection('simrs')->selectOne(
            "SELECT DESKRIPSI AS keluhan FROM medicalrecord.keluhan_utama WHERE KUNJUNGAN = ? LIMIT 1",
            [$noKunjungan]
        );

        $cppt = DB::connection('simrs')->selectOne(
            "SELECT SUBYEKTIF, OBYEKTIF, ASSESMENT, PLANNING, VERIFIKASI FROM medicalrecord.cppt WHERE KUNJUNGAN = ? ORDER BY TANGGAL DESC LIMIT 1",
            [$noKunjungan]
        );

        $diagnosa = DB::connection('simrs')->selectOne(
            "SELECT DIAGNOSA, KODE FROM medicalrecord.diagnosa WHERE NOPEN = ? LIMIT 1",
            [$nopen]
        );

        $normPasien = $pasien->no_rm;
        $tglKunjungan = substr($pasien->waktu_masuk, 0, 10);

        $bpjs = DB::connection('simrs')->selectOne("
        SELECT pj.NOMOR AS no_sep
        FROM pendaftaran.penjamin pj
        JOIN pendaftaran.pendaftaran pp ON pp.NOMOR = pj.NOPEN
        WHERE pp.NORM = ? AND pj.JENIS = 2 AND DATE(pp.TANGGAL) = ?
        ORDER BY pp.TANGGAL DESC LIMIT 1
    ", [$normPasien, $tglKunjungan]);

        $noSep = $bpjs->no_sep ?? null;
        $isBpjs = !empty($noSep);

        $berkasList = [];
        $jmlDokumen = $jmlTte = 0;
        $tteLengkap = false;

        if ($isBpjs && $noSep) {
            $berkasList = DB::connection('simrs')->select("
            SELECT
                bd.NAMA_FILE  AS nama_dokumen,
                'pdf'         AS ekstensi,
                bd.TANGGAL    AS tgl_upload,
                1             AS sudah_tte,
                pg.NAMA       AS tte_oleh,
                bd.TANGGAL    AS tgl_tte
            FROM berkas_klaim.berkas_detil bd
            JOIN pendaftaran.penjamin pj ON bd.NOMOR = pj.NOMOR
            JOIN pendaftaran.pendaftaran pp ON pp.NOMOR = pj.NOPEN
            LEFT JOIN aplikasi.pengguna pg ON pg.ID = bd.OLEH
            WHERE pp.NORM = ? AND pj.JENIS = 2 AND DATE(pp.TANGGAL) = ?
            ORDER BY bd.NAMA_FILE ASC
        ", [$normPasien, $tglKunjungan]);

            $jmlDokumen = count($berkasList);
            $jmlTte = $jmlDokumen;
            $tteLengkap = $jmlDokumen > 0;
        }

        $raw = DB::connection('simrs')->selectOne("
        SELECT
            (SELECT COUNT(1) FROM medicalrecord.diagnosa WHERE NOPEN = ? LIMIT 1) AS ada_diagnosa,
            (SELECT COUNT(1) FROM medicalrecord.keluhan_utama WHERE KUNJUNGAN = ? LIMIT 1) AS ada_anamnesis,
            (SELECT COUNT(1) FROM medicalrecord.anamnesis WHERE KUNJUNGAN = ? AND (RPS IS NOT NULL OR RPT IS NOT NULL) LIMIT 1) AS ada_riwayat,
            (SELECT COUNT(1) FROM medicalrecord.status_fungsional WHERE KUNJUNGAN = ? LIMIT 1) AS ada_status_fungsional,
            (SELECT COUNT(1) FROM medicalrecord.skrining_intervensi_dan_rekomendasi WHERE KUNJUNGAN = ? LIMIT 1) AS ada_skrining_gizi,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = ? AND OBYEKTIF IS NOT NULL AND OBYEKTIF NOT IN ('','null','[]') LIMIT 1) AS ada_tanda_vital,
            (SELECT COUNT(1) FROM medicalrecord.penilaian_nyeri WHERE KUNJUNGAN = ? LIMIT 1) AS ada_nyeri,
            (SELECT COUNT(1) FROM medicalrecord.faktor_risiko WHERE KUNJUNGAN = ? LIMIT 1) AS ada_faktor_risiko,
            (SELECT COUNT(1) FROM medicalrecord.edukasi_pasien_keluarga WHERE KUNJUNGAN = ? LIMIT 1) AS ada_edukasi,
            (SELECT COUNT(1) FROM medicalrecord.asuhan_keperawatan WHERE KUNJUNGAN = ? LIMIT 1) AS ada_asuhan,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = ? LIMIT 1) AS ada_cppt,
            (SELECT COUNT(1) FROM medicalrecord.cppt WHERE KUNJUNGAN = ? AND VERIFIKASI > 0 LIMIT 1) AS ada_ttd
    ", [
            $nopen,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan,
            $noKunjungan
        ]);

        $fl = $this->getFieldLabels($pasien->nama_poli ?? '');
        $k = $this->hitungKelengkapan($raw, $fl);
        $ops = $this->hitungOpsional($raw);

        return [
            'success'        => true,
            'pasien'         => $pasien,
            'keluhan'        => $keluhan,
            'cppt'           => $cppt,
            'diagnosa'       => $diagnosa,
            'kelengkapan'    => $k,
            'opsional'       => $ops,
            'tte'            => null,
            'berkas'         => $berkasList,
            'jml_dokumen'    => $jmlDokumen,
            'jml_tte'        => $jmlTte,
            'tte_lengkap'    => $tteLengkap,
            'no_sep'         => $noSep,
            'is_bpjs'        => $isBpjs,
            // 'kontak_dokter'  => $pasien->kontak_dokter ?? null,
        ];
    }

    public function clearCache()
    {
        Cache::flush(); // Bisa disesuaikan jika hanya ingin prefix tertentu
        return ['success' => true, 'message' => 'Cache dibersihkan'];
    }
}
