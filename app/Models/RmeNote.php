<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RmeNote extends Model
{
    protected $fillable = [
        'no_kunjungan',
        'user_id',
        'catatan',
        'status',
        'dikirim_at',
        'wa_status',
        'wa_error'
    ];

    protected $casts = [
        'dikirim_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
