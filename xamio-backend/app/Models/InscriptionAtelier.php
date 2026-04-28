<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InscriptionAtelier extends Model
{
    use HasFactory;

    protected $table      = 'inscription_ateliers';
    protected $primaryKey = 'insc_id';

    protected $fillable = [
        'insc_nom',
        'insc_email',
        'insc_date_inscription',
        'atelier_id',
    ];

    protected $casts = [
        'insc_date_inscription' => 'datetime',
    ];

    // ── Relations ──────────────────────────────

    public function atelier()
    {
        return $this->belongsTo(Atelier::class, 'atelier_id');
    }
}
