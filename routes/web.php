<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\PasienController;
use App\Http\Controllers\Api\RmeNoteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Auth/Login');
})->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth'])->prefix('api')->group(function () {
    Route::get('/pasien-hari-ini', [PasienController::class, 'hariIni'])->name('api.pasien.hari-ini');
    Route::get('/pasien-detail', [PasienController::class, 'detail'])->name('api.pasien.detail');
    Route::get('/clear-cache', [PasienController::class, 'clearCache'])->name('api.pasien.clear-cache');

    Route::get('/rme-notes', [RmeNoteController::class, 'index']);
    Route::post('/rme-notes', [RmeNoteController::class, 'store']);
    Route::post('/rme-notes/resend/{note}', [RmeNoteController::class, 'resend'])->middleware('auth');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/detail/{no_rawat}', function ($no_rawat) {
        return Inertia::render('Detail', ['no_rawat' => $no_rawat]);
    })->name('detail');

    Route::get('/dashboard-simgos', function () {
        return Inertia::render('DashboardSimgos');
    })->name('dashboard-simgos');

    Route::get('/detail-simgos/{no_rawat}', function ($no_rawat) {
        return Inertia::render('DetailSimgos', ['no_rawat' => $no_rawat]);
    })->name('detail-simgos');
});

require __DIR__ . '/auth.php';
