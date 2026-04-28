<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembreDepartement extends Model
{
    protected $primaryKey = 'membdept_id';

    protected $fillable = [
        'membdept_date_ajout',
        'user_id',
        'dept_id',
    ];

    protected $casts = [
        'membdept_date_ajout' => 'date',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'dept_id', 'dept_id');
    }
}
