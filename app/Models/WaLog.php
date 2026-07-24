<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaLog extends Model
{
    protected $fillable = [
        'no_kunjungan',
        'target',
        'message',
        'status',
        'response',
        'error',
        'type',
        'note_id',
    ];

    public function note()
    {
        return $this->belongsTo(RmeNote::class, 'note_id');
    }
}