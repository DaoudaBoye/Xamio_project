<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgrammeAtelier extends Model
{
    use HasFactory;

    protected $table      = 'programme_ateliers';
    protected $primaryKey = 'prog_id';

    protected $fillable = [
        'prog_heure',
        'prog_intitule',
        'prog_ordre',
        'atelier_id',
    ];

    // ── Relations ──────────────────────────────

    public function atelier()
    {
        return $this->belongsTo(Atelier::class, 'atelier_id');
    }
}
