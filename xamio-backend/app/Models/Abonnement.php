<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Abonnement extends Model
{
    use HasFactory;

    protected $primaryKey = 'abo_id';

    protected $fillable = [
        'abo_date_debut',
        'abo_date_fin',
        'abo_statut',
        'abo_montant_fcfa',
        'org_id',
        'plan_id',
    ];

    protected $casts = [
        'abo_date_debut'   => 'date',
        'abo_date_fin'     => 'date',
        'abo_montant_fcfa' => 'integer',
    ];

    // ── Relations ──────────────────────────────

    public function organisation()
    {
        return $this->belongsTo(Organisation::class, 'org_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    // ── Helpers ────────────────────────────────

    public function estActif(): bool
    {
        return $this->abo_statut === 'actif';
    }
}
