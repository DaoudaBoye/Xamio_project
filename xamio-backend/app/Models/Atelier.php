<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Atelier extends Model
{
    protected $primaryKey = 'atelier_id';

    protected $fillable = [
        'atelier_titre',
        'atelier_date',
        'atelier_categorie',
        'atelier_statut',
        'atelier_max_participants',
        'org_id',
        'dept_id',    // ← ajouté
    ];

    protected $casts = [
        'atelier_date' => 'date',
    ];

    /* ── Relations ─────────────────────────────────────────── */

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'org_id', 'org_id');
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class, 'dept_id', 'dept_id');
    }

    public function inscriptions(): HasMany
    {
        return $this->hasMany(InscriptionAtelier::class, 'atelier_id', 'atelier_id');
    }

    public function programmes(): HasMany
    {
        return $this->hasMany(ProgrammeAtelier::class, 'atelier_id', 'atelier_id');
    }
}
