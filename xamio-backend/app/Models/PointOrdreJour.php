<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointOrdreJour extends Model
{
    protected $primaryKey = 'poj_id';

    protected $fillable = [
        'poj_ordre',
        'poj_intitule',
        'reun_id',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function reunion(): BelongsTo
    {
        return $this->belongsTo(Reunion::class, 'reun_id', 'reun_id');
    }
}
