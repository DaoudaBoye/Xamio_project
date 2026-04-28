<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evenement extends Model
{
    use HasFactory;

    protected $table      = 'evenements';
    protected $primaryKey = 'evt_id';

    protected $fillable = [
        'evt_titre',
        'evt_date',
        'evt_type',
        'evt_statut',
        'evt_nb_participants',
        'org_id',
    ];

    protected $casts = [
        'evt_date'            => 'date',
        'evt_nb_participants' => 'integer',
    ];

    // ── Relations ──────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    // ── Helpers ────────────────────────────────

    public function estPasse(): bool
    {
        return $this->evt_date->isPast();
    }

    public function estEnCours(): bool
    {
        return $this->evt_statut === 'en_cours';
    }
}
