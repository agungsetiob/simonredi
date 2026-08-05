<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PasienService;
use Illuminate\Http\Request;

class PasienController extends Controller
{
    protected $pasienService;

    public function __construct(PasienService $pasienService)
    {
        $this->pasienService = $pasienService;
    }

    public function hariIni(Request $request)
    {
        $tanggal = $request->input('tgl', date('Y-m-d'));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            $tanggal = date('Y-m-d');
        }
        $force = (bool) $request->input('refresh', false);

        return response()->json(
            $this->pasienService->getPasienHariIni($tanggal, $force)
        );
    }

    public function detail(Request $request)
    {
        $noKunjungan = $request->input('no_rawat');
        if (!$noKunjungan) {
            return response()->json(['success' => false, 'error' => 'Parameter no_rawat tidak ada'], 400);
        }
        return response()->json(
            $this->pasienService->getDetailPasien($noKunjungan)
        );
    }

    public function clearCache()
    {
        return response()->json($this->pasienService->clearCache());
    }
}