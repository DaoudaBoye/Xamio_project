<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reunion extends Model
{
    protected $primaryKey = 'reun_id';

    protected $fillable = [
        'reun_titre',
        'reun_date',
        'reun_heure',
        'reun_duree_min',
        'reun_lieu',
        'reun_statut',
        'reun_visibilite',
        'user_id',
        'org_id',
        'reun_annul_motif',
        'reun_report_motif',
    ];

    protected $casts = [
        'reun_date' => 'date:Y-m-d',
    ];

    // ── Accessor — statut calculé dynamiquement ───────────────────────────────

    public function getStatutCalculeAttribute(): string
    {
        // Statuts finaux — priorité absolue, pas de calcul
        if (in_array($this->reun_statut, ['annulee', 'reportee', 'terminee', 'en_cours'])) {
            return $this->reun_statut;
        }

        // Pas d'heure définie — on retourne le statut brut
        if (!$this->reun_heure) {
            return $this->reun_statut;
        }

        $debut = Carbon::parse(
            $this->reun_date->format('Y-m-d') . ' ' . $this->reun_heure
        );
        $now = Carbon::now();

        // Imminente — 15 min avant le début
        if ($now->greaterThan($debut->copy()->subMinutes(15)) && $now->lessThan($debut)) {
            return 'imminente';
        }

        return $this->reun_statut;
    }

    // ── Append automatique dans les réponses JSON ─────────────────────────────

    protected $appends = ['statut_calcule'];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function organisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function departements(): BelongsToMany
    {
        return $this->belongsToMany(
            Departement::class,
            'reunion_departement',
            'reun_id',
            'dept_id',
            'reun_id',
            'dept_id'
        );
    }

    public function pointOrdreJours(): HasMany
    {
        return $this->hasMany(PointOrdreJour::class, 'reun_id', 'reun_id')
                    ->orderBy('poj_ordre');
    }

    public function participantReunions(): HasMany
    {
        return $this->hasMany(ParticipantReunion::class, 'reun_id', 'reun_id');
    }

    public function compteRendu(): HasOne
    {
        return $this->hasOne(CompteRendu::class, 'reun_id', 'reun_id');
    }
}