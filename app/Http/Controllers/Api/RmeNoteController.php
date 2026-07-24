<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RmeNote;
use App\Models\WaLog;
use App\Services\FonnteService;
use App\Services\PasienService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RmeNoteController extends Controller
{
    protected $pasienService;
    protected $fonnte;

    public function __construct(PasienService $pasienService, FonnteService $fonnte)
    {
        $this->pasienService = $pasienService;
        $this->fonnte = $fonnte;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_kunjungan' => 'required|string',
            'catatan'      => 'required|string|max:1000',
        ]);

        // Ambil data pasien
        $detail = $this->pasienService->getDetailPasien($validated['no_kunjungan']);

        if (!$detail['success']) {
            $note = RmeNote::create([
                'no_kunjungan' => $validated['no_kunjungan'],
                'user_id'      => Auth::id(),
                'catatan'      => $validated['catatan'],
                'status'       => 'draft',
                'dikirim_at'   => now(),
                'wa_status'    => 'no_contact',
            ]);

            return response()->json([
                'success'  => false,
                'message'  => 'Data pasien tidak ditemukan, catatan disimpan sebagai draft.',
                'wa_status' => 'no_contact',
                'note'     => $note,
            ], 200);
        }

        $pasien = $detail['pasien'];
        $kontakDokter = $pasien->kontak_dokter ?? null;

        $note = RmeNote::create([
            'no_kunjungan' => $validated['no_kunjungan'],
            'user_id'      => Auth::id(),
            'catatan'      => $validated['catatan'],
            'status'       => 'draft',
            'dikirim_at'   => now(),
            'wa_status'    => 'pending',
        ]);

        $waStatus = 'pending';
        $waError  = null;
        $waMessage = '';

        if ($kontakDokter) {
            try {
                $namaPasien   = $pasien->nama_pasien ?? 'Pasien';
                $noRm         = $pasien->no_rm ?? '-';
                $poli         = $pasien->nama_poli ?? '-';
                $missingFields = $detail['kelengkapan']['missing'] ?? [];
                $missingText  = !empty($missingFields) ? implode(', ', $missingFields) : 'Tidak ada';
                $dokter = $pasien->nama_dokter ?? 'Tidak diketahui';

                $waMessage = "📋 *Catatan Kelengkapan RME*\n\n";
                $waMessage .= "Pasien: {$namaPasien}\n";
                $waMessage .= "No. RM: {$noRm}\n";
                $waMessage .= "Poli: {$poli}\n";
                $waMessage .= "Dokter: {$dokter}\n";
                $waMessage .= "📌 *Catatan:*\n{$validated['catatan']}\n\n";
                $waMessage .= "⚠️ Data yang perlu dilengkapi:\n{$missingText}\n\n";
                $waMessage .= "Silakan segera lengkapi data rekam medis pasien.\nTerima kasih.";

                $result = $this->fonnte->sendMessage($kontakDokter, $waMessage);

                $logData = [
                    'no_kunjungan' => $validated['no_kunjungan'],
                    'target'       => $kontakDokter,
                    'message'      => $waMessage,
                    'response'     => json_encode($result),
                    'note_id'      => $note->id,
                ];

                if (isset($result['status']) && $result['status'] === true) {
                    $waStatus = 'terkirim';
                    $note->status = 'terkirim';
                    $logData['status'] = 'success';
                } else {
                    $waStatus = 'gagal';
                    $waError  = $result['reason'] ?? 'Gagal mengirim WA (unknown reason)';
                    $logData['status'] = 'failed';
                    $logData['error'] = $waError;
                }

                $this->logWa($logData);
            } catch (\Exception $e) {
                Log::error('Gagal kirim WA: ' . $e->getMessage());
                $waStatus = 'gagal';
                $waError  = $e->getMessage();

                $this->logWa([
                    'no_kunjungan' => $validated['no_kunjungan'],
                    'target'       => $kontakDokter,
                    'message'      => $waMessage,
                    'status'       => 'failed',
                    'error'        => $waError,
                    'note_id'      => $note->id,
                ]);
            }
        } else {
            $waStatus = 'no_contact';
        }

        $note->wa_status = $waStatus;
        if ($waError) {
            $note->wa_error = $waError;
        }
        $note->save();

        $responseMessage = 'Catatan berhasil disimpan.';
        if ($waStatus === 'terkirim') {
            $responseMessage .= ' WhatsApp berhasil dikirim ke dokter.';
        } elseif ($waStatus === 'gagal') {
            $responseMessage .= ' WhatsApp gagal dikirim. Silakan coba kirim ulang.';
        } elseif ($waStatus === 'no_contact') {
            $responseMessage .= ' Tidak ada kontak dokter untuk dikirim WA.';
        }

        return response()->json([
            'success'  => true,
            'message'  => $responseMessage,
            'wa_status' => $waStatus,
            'note'     => $note,
        ]);
    }

    public function resend($id)
    {
        $note = RmeNote::findOrFail($id);

        if ($note->wa_status === 'terkirim') {
            return response()->json([
                'success' => false,
                'message' => 'Catatan ini sudah terkirim.',
            ], 400);
        }

        $detail = $this->pasienService->getDetailPasien($note->no_kunjungan);
        if (!$detail['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien tidak ditemukan.',
            ], 404);
        }

        $pasien = $detail['pasien'];
        $kontakDokter = $pasien->kontak_dokter ?? null;

        if (!$kontakDokter) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada kontak dokter.',
            ], 400);
        }

        // Siapkan pesan WA
        $namaPasien   = $pasien->nama_pasien ?? 'Pasien';
        $noRm         = $pasien->no_rm ?? '-';
        $poli         = $pasien->nama_poli ?? '-';
        $missingFields = $detail['kelengkapan']['missing'] ?? [];
        $missingText  = !empty($missingFields) ? implode(', ', $missingFields) : 'Tidak ada';
        $dokter = $pasien->nama_dokter ?? 'Tidak diketahui';

        $waMessage = "📋 *Catatan Kelengkapan RME*\n\n";
        $waMessage .= "Pasien: {$namaPasien}\n";
        $waMessage .= "No. RM: {$noRm}\n";
        $waMessage .= "Poli: {$poli}\n";
        $waMessage .= "Dokter: {$dokter}\n";
        $waMessage .= "📌 *Catatan:*\n{$note->catatan}\n\n";
        $waMessage .= "⚠️ Data yang perlu dilengkapi:\n{$missingText}\n\n";
        $waMessage .= "Silakan segera lengkapi data rekam medis pasien.\nTerima kasih.";

        try {
            $result = $this->fonnte->sendMessage($kontakDokter, $waMessage);

            $logData = [
                'no_kunjungan' => $note->no_kunjungan,
                'target'       => $kontakDokter,
                'message'      => $waMessage,
                'response'     => json_encode($result),
                'note_id'      => $note->id,
            ];

            if (isset($result['status']) && $result['status'] === true) {
                $note->wa_status = 'terkirim';
                $note->status    = 'terkirim';
                $note->wa_error  = null;
                $logData['status'] = 'success';
            } else {
                $error = $result['reason'] ?? 'Gagal mengirim WA (unknown reason)';
                $note->wa_status = 'gagal';
                $note->wa_error  = $error;
                $logData['status'] = 'failed';
                $logData['error']  = $error;
            }

            $note->save();
            $this->logWa($logData);

            return response()->json([
                'success'  => true,
                'message'  => $note->wa_status === 'terkirim' ? 'WA berhasil dikirim ulang.' : 'Gagal mengirim ulang.',
                'wa_status' => $note->wa_status,
            ]);
        } catch (\Exception $e) {
            Log::error('Resend WA gagal: ' . $e->getMessage());

            $note->wa_status = 'gagal';
            $note->wa_error  = $e->getMessage();
            $note->save();

            $this->logWa([
                'no_kunjungan' => $note->no_kunjungan,
                'target'       => $kontakDokter,
                'message'      => $waMessage,
                'status'       => 'failed',
                'error'        => $e->getMessage(),
                'note_id'      => $note->id,
            ]);

            return response()->json([
                'success'  => false,
                'message'  => 'Gagal mengirim ulang WA: ' . $e->getMessage(),
                'wa_status' => 'gagal',
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $noKunjungan = $request->get('no_kunjungan');

        if (!$noKunjungan) {
            return response()->json(['success' => false, 'message' => 'no_kunjungan required'], 400);
        }

        $notes = RmeNote::where('no_kunjungan', $noKunjungan)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $notes
        ]);
    }

    protected function logWa($data)
    {
        return WaLog::create([
            'no_kunjungan' => $data['no_kunjungan'] ?? null,
            'target'       => $data['target'] ?? null,
            'message'      => $data['message'] ?? null,
            'status'       => $data['status'] ?? 'pending',
            'response'     => $data['response'] ?? null,
            'error'        => $data['error'] ?? null,
            'type'         => $data['type'] ?? 'rme_note',
            'note_id'      => $data['note_id'] ?? null,
        ]);
    }
}
